-- ApoderaMe · esquema inicial MVP
-- Diseñado para Supabase/PostgreSQL con aislamiento por colegio y curso.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from anon, authenticated;

create type public.app_role as enum (
  'apoderado',
  'presidente',
  'tesorero',
  'secretario',
  'profesor_jefe',
  'admin_colegio'
);
create type public.guardian_relationship as enum ('madre', 'padre', 'tutor', 'otro');
create type public.activity_status as enum ('proxima', 'en_curso', 'finalizada', 'cancelada');
create type public.attendance_status as enum ('asistire', 'no_asistire', 'sin_responder');
create type public.fee_status as enum ('pendiente', 'parcial', 'en_revision', 'pagado', 'rechazado');
create type public.payment_method as enum ('transferencia', 'efectivo', 'otro');
create type public.notification_kind as enum ('pago', 'actividad', 'asistencia', 'general');
create type public.privacy_request_type as enum (
  'acceso',
  'rectificacion',
  'supresion',
  'oposicion',
  'portabilidad',
  'bloqueo'
);
create type public.privacy_request_status as enum ('recibida', 'en_revision', 'resuelta', 'rechazada');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rbd integer unique,
  commune text not null,
  region text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  paternal_surname text not null,
  maternal_surname text,
  email text not null,
  phone text,
  avatar_path text,
  privacy_notice_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.person_identifiers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  rut_normalized text not null unique check (rut_normalized ~ '^[0-9]{7,8}[0-9K]$'),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

comment on table private.person_identifiers is
  'PII sin acceso directo desde clientes. Usar únicamente funciones seguras de servidor.';

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, profile_id, role)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  level smallint not null check (level between 1 and 12),
  section text not null check (char_length(section) between 1 and 3),
  academic_year smallint not null check (academic_year between 2020 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, academic_year, level, section),
  unique (id, school_id)
);

create table public.course_roles (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, profile_id, role),
  check (role in ('presidente', 'tesorero', 'secretario', 'profesor_jefe'))
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  course_id uuid not null,
  first_name text not null,
  paternal_surname text not null,
  maternal_surname text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, course_id),
  foreign key (course_id, school_id)
    references public.courses(id, school_id)
    on delete restrict
);

create table private.student_identifiers (
  student_id uuid primary key references public.students(id) on delete cascade,
  rut_normalized text unique check (
    rut_normalized is null or rut_normalized ~ '^[0-9]{7,8}[0-9K]$'
  ),
  created_at timestamptz not null default now()
);

create table public.guardian_students (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  relationship public.guardian_relationship not null,
  is_primary boolean not null default false,
  authorized_for_finances boolean not null default true,
  authorized_for_attendance boolean not null default true,
  created_at timestamptz not null default now(),
  unique (guardian_id, student_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  title text not null,
  description text not null default '',
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.activity_status not null default 'proxima',
  estimated_amount bigint not null default 0 check (estimated_amount >= 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  status public.attendance_status not null default 'sin_responder',
  responded_by uuid references public.profiles(id),
  responded_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, student_id)
);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  student_id uuid not null,
  concept text not null,
  due_date date not null,
  total_amount bigint not null check (total_amount > 0),
  status public.fee_status not null default 'pendiente',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, course_id)
    references public.students(id, course_id)
    on delete restrict
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references public.fees(id) on delete restrict,
  submitted_by uuid not null references public.profiles(id),
  amount bigint not null check (amount > 0),
  paid_at timestamptz not null,
  method public.payment_method not null default 'transferencia',
  reference text,
  status public.fee_status not null default 'en_revision',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status <> 'rechazado' and rejection_reason is null)
    or (status = 'rechazado' and rejection_reason is not null)
  )
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_expenses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  description text not null,
  supplier_name text,
  amount bigint not null check (amount > 0),
  expense_date date not null,
  receipt_path text,
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  request_type public.privacy_request_type not null,
  details text not null,
  status public.privacy_request_status not null default 'recibida',
  due_at timestamptz not null default (now() + interval '30 days'),
  resolved_by uuid references public.profiles(id),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  school_id uuid references public.schools(id) on delete restrict,
  course_id uuid references public.courses(id) on delete restrict,
  table_name text not null,
  record_id uuid,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now()
);

create index courses_school_idx on public.courses (school_id);
create index students_course_idx on public.students (course_id);
create index guardian_students_guardian_idx on public.guardian_students (guardian_id);
create index guardian_students_student_idx on public.guardian_students (student_id);
create index activities_course_starts_idx on public.activities (course_id, starts_at);
create index attendances_student_idx on public.attendances (student_id);
create index fees_student_due_idx on public.fees (student_id, due_date);
create index payments_fee_idx on public.payments (fee_id);
create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index privacy_requests_school_idx on public.privacy_requests (school_id, created_at desc);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id, occurred_at desc);
create index audit_logs_school_idx on public.audit_logs (school_id, occurred_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_set_updated_at before update on public.schools
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();
create trigger attendances_set_updated_at before update on public.attendances
for each row execute function public.set_updated_at();
create trigger fees_set_updated_at before update on public.fees
for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.activity_expenses
for each row execute function public.set_updated_at();
create trigger privacy_requests_set_updated_at before update on public.privacy_requests
for each row execute function public.set_updated_at();

create or replace function public.validate_attendance_course()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.activities activity
    join public.students student on student.course_id = activity.course_id
    where activity.id = new.activity_id
      and student.id = new.student_id
  ) then
    raise exception 'La actividad y el estudiante deben pertenecer al mismo curso'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger attendances_validate_course
before insert or update of activity_id, student_id on public.attendances
for each row execute function public.validate_attendance_course();

create or replace function public.is_school_admin(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_memberships membership
    where membership.school_id = target_school_id
      and membership.profile_id = auth.uid()
      and membership.role = 'admin_colegio'
      and membership.active
  );
$$;

create or replace function public.is_course_staff(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.course_roles role
      where role.course_id = target_course_id
        and role.profile_id = auth.uid()
        and role.active
    )
    or exists (
      select 1
      from public.courses course
      where course.id = target_course_id
        and public.is_school_admin(course.school_id)
    );
$$;

create or replace function public.is_course_treasurer(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.course_roles role
      where role.course_id = target_course_id
        and role.profile_id = auth.uid()
        and role.role in ('tesorero', 'presidente')
        and role.active
    )
    or exists (
      select 1
      from public.courses course
      where course.id = target_course_id
        and public.is_school_admin(course.school_id)
    );
$$;

create or replace function public.can_manage_course_people(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.course_roles role
      where role.course_id = target_course_id
        and role.profile_id = auth.uid()
        and role.role = 'profesor_jefe'
        and role.active
    )
    or exists (
      select 1
      from public.courses course
      where course.id = target_course_id
        and public.is_school_admin(course.school_id)
    );
$$;

create or replace function public.can_manage_course_activities(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.course_roles role
      where role.course_id = target_course_id
        and role.profile_id = auth.uid()
        and role.role in ('profesor_jefe', 'presidente', 'secretario')
        and role.active
    )
    or exists (
      select 1
      from public.courses course
      where course.id = target_course_id
        and public.is_school_admin(course.school_id)
    );
$$;

create or replace function public.is_guardian_of(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guardian_students link
    where link.student_id = target_student_id
      and link.guardian_id = auth.uid()
  );
$$;

create or replace function public.can_manage_student_finances(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guardian_students link
    where link.student_id = target_student_id
      and link.guardian_id = auth.uid()
      and link.authorized_for_finances
  );
$$;

create or replace function public.can_respond_student_attendance(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guardian_students link
    where link.student_id = target_student_id
      and link.guardian_id = auth.uid()
      and link.authorized_for_attendance
  );
$$;

create or replace function public.can_access_school(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_school_admin(target_school_id)
    or exists (
      select 1
      from public.school_memberships membership
      where membership.school_id = target_school_id
        and membership.profile_id = auth.uid()
        and membership.active
    )
    or exists (
      select 1
      from public.guardian_students link
      join public.students student on student.id = link.student_id
      where student.school_id = target_school_id
        and link.guardian_id = auth.uid()
        and student.active
    );
$$;

create or replace function public.can_access_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_course_staff(target_course_id)
    or exists (
      select 1
      from public.guardian_students link
      join public.students student on student.id = link.student_id
      where student.course_id = target_course_id
        and link.guardian_id = auth.uid()
        and student.active
    );
$$;

revoke all on function public.is_school_admin(uuid) from public;
revoke all on function public.is_course_staff(uuid) from public;
revoke all on function public.is_course_treasurer(uuid) from public;
revoke all on function public.can_manage_course_people(uuid) from public;
revoke all on function public.can_manage_course_activities(uuid) from public;
revoke all on function public.is_guardian_of(uuid) from public;
revoke all on function public.can_manage_student_finances(uuid) from public;
revoke all on function public.can_respond_student_attendance(uuid) from public;
revoke all on function public.can_access_school(uuid) from public;
revoke all on function public.can_access_course(uuid) from public;
grant execute on function public.is_school_admin(uuid) to authenticated;
grant execute on function public.is_course_staff(uuid) to authenticated;
grant execute on function public.is_course_treasurer(uuid) to authenticated;
grant execute on function public.can_manage_course_people(uuid) to authenticated;
grant execute on function public.can_manage_course_activities(uuid) to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
grant execute on function public.can_manage_student_finances(uuid) to authenticated;
grant execute on function public.can_respond_student_attendance(uuid) to authenticated;
grant execute on function public.can_access_school(uuid) to authenticated;
grant execute on function public.can_access_course(uuid) to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.school_memberships enable row level security;
alter table public.courses enable row level security;
alter table public.course_roles enable row level security;
alter table public.students enable row level security;
alter table public.guardian_students enable row level security;
alter table public.activities enable row level security;
alter table public.attendances enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.activity_expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table private.person_identifiers enable row level security;
alter table private.student_identifiers enable row level security;

alter table public.schools force row level security;
alter table public.profiles force row level security;
alter table public.school_memberships force row level security;
alter table public.courses force row level security;
alter table public.course_roles force row level security;
alter table public.students force row level security;
alter table public.guardian_students force row level security;
alter table public.activities force row level security;
alter table public.attendances force row level security;
alter table public.fees force row level security;
alter table public.payments force row level security;
alter table public.receipts force row level security;
alter table public.activity_expenses force row level security;
alter table public.notifications force row level security;
alter table public.privacy_requests force row level security;
alter table public.audit_logs force row level security;
alter table private.person_identifiers force row level security;
alter table private.student_identifiers force row level security;

revoke all on private.person_identifiers from anon, authenticated;
revoke all on private.student_identifiers from anon, authenticated;

-- Tesorería puede resolver una presentación, pero no alterar monto, cuota ni autor.
revoke update on public.payments from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke update on public.activities from authenticated;
grant update (title, description, location, starts_at, ends_at, status, estimated_amount)
  on public.activities to authenticated;
revoke update on public.attendances from authenticated;
grant update (status, responded_by, responded_at, note)
  on public.attendances to authenticated;
revoke update on public.privacy_requests from authenticated;
grant update (status, resolved_by, resolution_note, resolved_at)
  on public.privacy_requests to authenticated;
revoke delete on public.school_memberships, public.courses, public.course_roles,
  public.students, public.guardian_students, public.activities, public.attendances,
  public.fees, public.payments, public.receipts, public.activity_expenses,
  public.privacy_requests, public.audit_logs from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;

create policy "schools_select_member" on public.schools for select to authenticated
using (public.can_access_school(id));
create policy "schools_admin_update" on public.schools for update to authenticated
using (public.is_school_admin(id)) with check (public.is_school_admin(id));

create policy "profiles_select_self" on public.profiles for select to authenticated
using (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "memberships_select_self_or_admin" on public.school_memberships for select to authenticated
using (profile_id = auth.uid() or public.is_school_admin(school_id));
create policy "memberships_admin_manage" on public.school_memberships for all to authenticated
using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));

create policy "courses_select_member" on public.courses for select to authenticated
using (public.can_access_course(id));
create policy "courses_admin_manage" on public.courses for all to authenticated
using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));

create policy "course_roles_select_member" on public.course_roles for select to authenticated
using (public.can_access_course(course_id));
create policy "course_roles_admin_manage" on public.course_roles for all to authenticated
using (
  exists (
    select 1 from public.courses course
    where course.id = course_roles.course_id and public.is_school_admin(course.school_id)
  )
) with check (
  exists (
    select 1 from public.courses course
    where course.id = course_roles.course_id and public.is_school_admin(course.school_id)
  )
);

create policy "students_select_related" on public.students for select to authenticated
using (public.is_guardian_of(id) or public.is_course_staff(course_id));
create policy "students_staff_manage" on public.students for all to authenticated
using (public.can_manage_course_people(course_id))
with check (public.can_manage_course_people(course_id));

create policy "guardian_links_select_related" on public.guardian_students for select to authenticated
using (
  guardian_id = auth.uid()
  or exists (
    select 1 from public.students student
    where student.id = guardian_students.student_id
      and public.can_manage_course_people(student.course_id)
  )
);
create policy "guardian_links_staff_manage" on public.guardian_students for all to authenticated
using (
  exists (
    select 1 from public.students student
    where student.id = guardian_students.student_id
      and public.can_manage_course_people(student.course_id)
  )
) with check (
  exists (
    select 1 from public.students student
    where student.id = guardian_students.student_id
      and public.can_manage_course_people(student.course_id)
  )
);

create policy "activities_select_course" on public.activities for select to authenticated
using (public.can_access_course(course_id));
create policy "activities_staff_insert" on public.activities for insert to authenticated
with check (public.can_manage_course_activities(course_id) and created_by = auth.uid());
create policy "activities_staff_update" on public.activities for update to authenticated
using (public.can_manage_course_activities(course_id))
with check (public.can_manage_course_activities(course_id));

create policy "attendances_select_related" on public.attendances for select to authenticated
using (
  public.is_guardian_of(student_id)
  or exists (
    select 1 from public.activities activity
    where activity.id = attendances.activity_id
      and public.can_manage_course_activities(activity.course_id)
  )
);
create policy "attendances_guardian_update" on public.attendances for update to authenticated
using (public.can_respond_student_attendance(student_id))
with check (public.can_respond_student_attendance(student_id) and responded_by = auth.uid());
create policy "attendances_staff_insert" on public.attendances for insert to authenticated
with check (
  exists (
    select 1 from public.activities activity
    where activity.id = attendances.activity_id
      and public.can_manage_course_activities(activity.course_id)
  )
);
create policy "attendances_staff_update" on public.attendances for update to authenticated
using (
  exists (
    select 1 from public.activities activity
    where activity.id = attendances.activity_id
      and public.can_manage_course_activities(activity.course_id)
  )
) with check (
  exists (
    select 1 from public.activities activity
    where activity.id = attendances.activity_id
      and public.can_manage_course_activities(activity.course_id)
  )
);

create policy "fees_select_related" on public.fees for select to authenticated
using (public.can_manage_student_finances(student_id) or public.is_course_staff(course_id));
create policy "fees_treasurer_manage" on public.fees for all to authenticated
using (public.is_course_treasurer(course_id)) with check (public.is_course_treasurer(course_id));

create policy "payments_select_related" on public.payments for select to authenticated
using (
  submitted_by = auth.uid()
  or exists (
    select 1 from public.fees fee
    where fee.id = payments.fee_id
      and (public.is_guardian_of(fee.student_id) or public.is_course_treasurer(fee.course_id))
  )
);
create policy "payments_guardian_insert" on public.payments for insert to authenticated
with check (
  submitted_by = auth.uid()
  and status = 'en_revision'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
  and exists (
    select 1 from public.fees fee
    where fee.id = payments.fee_id
      and public.can_manage_student_finances(fee.student_id)
  )
);
create policy "receipts_select_related" on public.receipts for select to authenticated
using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.payments payment
    join public.fees fee on fee.id = payment.fee_id
    where payment.id = receipts.payment_id
      and public.is_course_treasurer(fee.course_id)
  )
);
create policy "receipts_guardian_insert" on public.receipts for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.payments payment
    join public.fees fee on fee.id = payment.fee_id
    where payment.id = receipts.payment_id
      and payment.submitted_by = auth.uid()
      and payment.status = 'en_revision'
      and public.can_manage_student_finances(fee.student_id)
  )
);

create policy "expenses_select_course" on public.activity_expenses for select to authenticated
using (
  exists (
    select 1 from public.activities activity
    where activity.id = activity_expenses.activity_id
      and public.can_access_course(activity.course_id)
  )
);
create policy "expenses_treasurer_manage" on public.activity_expenses for all to authenticated
using (
  exists (
    select 1 from public.activities activity
    where activity.id = activity_expenses.activity_id
      and public.is_course_treasurer(activity.course_id)
  )
) with check (
  exists (
    select 1 from public.activities activity
    where activity.id = activity_expenses.activity_id
      and public.is_course_treasurer(activity.course_id)
  )
);

create policy "notifications_select_own" on public.notifications for select to authenticated
using (recipient_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "privacy_requests_select_own_or_admin" on public.privacy_requests for select to authenticated
using (
  requester_id = auth.uid()
  or public.is_school_admin(school_id)
);
create policy "privacy_requests_insert_own" on public.privacy_requests for insert to authenticated
with check (
  requester_id = auth.uid()
  and public.can_access_school(school_id)
);
create policy "privacy_requests_admin_update" on public.privacy_requests for update to authenticated
using (public.is_school_admin(school_id))
with check (public.is_school_admin(school_id));

create policy "audit_logs_admin_select" on public.audit_logs for select to authenticated
using (school_id is not null and public.is_school_admin(school_id));

create or replace function public.review_payment(
  target_payment_id uuid,
  approve boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_payment public.payments%rowtype;
  selected_fee public.fees%rowtype;
  approved_total bigint;
begin
  if auth.uid() is null then
    raise exception 'Se requiere autenticación' using errcode = '42501';
  end if;

  select * into selected_payment
  from public.payments payment
  where payment.id = target_payment_id
  for update;

  if not found then
    raise exception 'Pago no encontrado' using errcode = 'P0002';
  end if;

  select * into selected_fee
  from public.fees fee
  where fee.id = selected_payment.fee_id
  for update;

  if not public.is_course_treasurer(selected_fee.course_id) then
    raise exception 'No autorizado para revisar este pago' using errcode = '42501';
  end if;

  if selected_payment.status <> 'en_revision' then
    raise exception 'El pago ya fue revisado' using errcode = '23514';
  end if;

  if approve then
    select coalesce(sum(payment.amount), 0) + selected_payment.amount
      into approved_total
    from public.payments payment
    where payment.fee_id = selected_fee.id
      and payment.status = 'pagado'
      and payment.id <> selected_payment.id;

    if approved_total > selected_fee.total_amount then
      raise exception 'La aprobación supera el monto total de la cuota'
        using errcode = '23514';
    end if;

    update public.payments
    set status = 'pagado',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = null
    where id = selected_payment.id;

    update public.fees
    set status = case
      when approved_total = total_amount then 'pagado'::public.fee_status
      else 'parcial'::public.fee_status
    end
    where id = selected_fee.id;
  else
    if nullif(btrim(reason), '') is null then
      raise exception 'Debes indicar el motivo del rechazo' using errcode = '23514';
    end if;

    update public.payments
    set status = 'rechazado',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = btrim(reason)
    where id = selected_payment.id;
  end if;
end;
$$;

revoke all on function public.review_payment(uuid, boolean, text) from public;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_record jsonb;
  new_record jsonb;
  source_record jsonb;
  target_id uuid;
  target_course_id uuid;
  target_school_id uuid;
begin
  if tg_op = 'DELETE' then
    old_record := to_jsonb(old);
    target_id := old.id;
  elsif tg_op = 'INSERT' then
    new_record := to_jsonb(new);
    target_id := new.id;
  else
    old_record := to_jsonb(old);
    new_record := to_jsonb(new);
    target_id := new.id;
  end if;

  source_record := coalesce(new_record, old_record);

  if tg_table_name in ('activities', 'fees') then
    target_course_id := nullif(source_record ->> 'course_id', '')::uuid;
  elsif tg_table_name = 'attendances' then
    select activity.course_id into target_course_id
    from public.activities activity
    where activity.id = nullif(source_record ->> 'activity_id', '')::uuid;
  elsif tg_table_name = 'payments' then
    select fee.course_id into target_course_id
    from public.fees fee
    where fee.id = nullif(source_record ->> 'fee_id', '')::uuid;
  elsif tg_table_name = 'activity_expenses' then
    select activity.course_id into target_course_id
    from public.activities activity
    where activity.id = nullif(source_record ->> 'activity_id', '')::uuid;
  elsif tg_table_name = 'privacy_requests' then
    target_school_id := nullif(source_record ->> 'school_id', '')::uuid;
  end if;

  if target_school_id is null and target_course_id is not null then
    select course.school_id into target_school_id
    from public.courses course
    where course.id = target_course_id;
  end if;

  insert into public.audit_logs (
    school_id,
    course_id,
    table_name,
    record_id,
    operation,
    actor_id,
    old_data,
    new_data
  ) values (
    target_school_id,
    target_course_id,
    tg_table_name,
    target_id,
    tg_op,
    auth.uid(),
    old_record,
    new_record
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.write_audit_log() from public;

create trigger activities_audit after insert or update or delete on public.activities
for each row execute function public.write_audit_log();
create trigger attendances_audit after insert or update or delete on public.attendances
for each row execute function public.write_audit_log();
create trigger fees_audit after insert or update or delete on public.fees
for each row execute function public.write_audit_log();
create trigger payments_audit after insert or update or delete on public.payments
for each row execute function public.write_audit_log();
create trigger expenses_audit after insert or update or delete on public.activity_expenses
for each row execute function public.write_audit_log();
create trigger privacy_requests_audit after insert or update or delete on public.privacy_requests
for each row execute function public.write_audit_log();
