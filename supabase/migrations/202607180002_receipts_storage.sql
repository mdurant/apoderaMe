-- Bucket privado para comprobantes de pago.
-- Ruta obligatoria: {school_id}/{course_id}/{payment_id}/{uuid}.{jpg|jpeg|png|pdf}

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_access_payment_receipt(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_school_id uuid;
  target_course_id uuid;
  target_payment_id uuid;
begin
  if object_name !~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$' then
    return false;
  end if;

  target_school_id := split_part(object_name, '/', 1)::uuid;
  target_course_id := split_part(object_name, '/', 2)::uuid;
  target_payment_id := split_part(object_name, '/', 3)::uuid;

  return exists (
    select 1
    from public.payments payment
    join public.fees fee on fee.id = payment.fee_id
    join public.courses course on course.id = fee.course_id
    where payment.id = target_payment_id
      and fee.course_id = target_course_id
      and course.school_id = target_school_id
      and (
        payment.submitted_by = auth.uid()
        or public.can_manage_student_finances(fee.student_id)
        or public.is_course_treasurer(fee.course_id)
      )
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function public.can_access_payment_receipt(text) from public;
grant execute on function public.can_access_payment_receipt(text) to authenticated;

create or replace function public.can_manage_payment_receipt(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_school_id uuid;
  target_course_id uuid;
  target_payment_id uuid;
begin
  if object_name !~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$' then
    return false;
  end if;

  target_school_id := split_part(object_name, '/', 1)::uuid;
  target_course_id := split_part(object_name, '/', 2)::uuid;
  target_payment_id := split_part(object_name, '/', 3)::uuid;

  return exists (
    select 1
    from public.payments payment
    join public.fees fee on fee.id = payment.fee_id
    join public.courses course on course.id = fee.course_id
    where payment.id = target_payment_id
      and fee.course_id = target_course_id
      and course.school_id = target_school_id
      and payment.submitted_by = auth.uid()
      and payment.status = 'en_revision'
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function public.can_manage_payment_receipt(text) from public;
grant execute on function public.can_manage_payment_receipt(text) to authenticated;

create or replace function public.validate_receipt_storage_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_school_id uuid;
  target_course_id uuid;
  target_payment_id uuid;
begin
  if new.storage_path !~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$' then
    raise exception 'Ruta de comprobante inválida' using errcode = '23514';
  end if;

  target_school_id := split_part(new.storage_path, '/', 1)::uuid;
  target_course_id := split_part(new.storage_path, '/', 2)::uuid;
  target_payment_id := split_part(new.storage_path, '/', 3)::uuid;

  if target_payment_id <> new.payment_id or not exists (
    select 1
    from public.payments payment
    join public.fees fee on fee.id = payment.fee_id
    join public.courses course on course.id = fee.course_id
    where payment.id = new.payment_id
      and fee.course_id = target_course_id
      and course.school_id = target_school_id
  ) then
    raise exception 'La ruta no coincide con el pago, curso y colegio'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_receipt_storage_path() from public;

create trigger receipts_validate_storage_path
before insert or update of storage_path, payment_id on public.receipts
for each row execute function public.validate_receipt_storage_path();

create policy "payment_receipts_select_related"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and public.can_access_payment_receipt(name)
);

create policy "payment_receipts_insert_guardian"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and public.can_manage_payment_receipt(name)
);

