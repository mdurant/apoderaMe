import { demoPayments } from '@/data/demo';
import type { PendingPaymentReview } from '@/domain/models';
import { getSupabase } from '@/lib/supabase';
import { mapPendingPaymentReview, nestedName, toNumber } from '@/repositories/mappers';
import { RepositoryError, toRepositoryError } from '@/repositories/errors';

export async function listPendingPayments(
  mode: 'demo' | 'supabase',
): Promise<PendingPaymentReview[]> {
  if (mode === 'demo') {
    const pending = demoPayments.filter((payment) => payment.status === 'en_revision');
    return pending.map((payment) => ({
      id: payment.id,
      feeId: payment.feeId,
      amount: payment.amount,
      paidAt: payment.paidAt,
      reference: payment.reference,
      studentName: 'Martina Soto',
      courseName: '5° Básico B',
      concept: 'Salida pedagógica al MIM',
    }));
  }

  try {
    const client = getSupabase();
    const { data: paymentRows, error } = await client
      .from('payments')
      .select('id, fee_id, amount, paid_at, reference, status')
      .eq('status', 'en_revision')
      .order('paid_at', { ascending: false });

    if (error) {
      throw new RepositoryError('No se pudieron cargar los pagos pendientes', error);
    }

    if (!paymentRows?.length) {
      return [];
    }

    const feeIds = paymentRows.map((payment) => payment.fee_id);
    const { data: feeRows, error: feesError } = await client
      .from('fees')
      .select('id, concept, student_id, course_id')
      .in('id', feeIds);

    if (feesError) {
      throw new RepositoryError('No se pudieron cargar las cuotas asociadas', feesError);
    }

    const studentIds = [...new Set((feeRows ?? []).map((fee) => fee.student_id))];
    const { data: studentRows, error: studentsError } = await client
      .from('students')
      .select('id, first_name, paternal_surname, courses(name)')
      .in('id', studentIds);

    if (studentsError) {
      throw new RepositoryError('No se pudieron cargar los estudiantes', studentsError);
    }

    const feesById = new Map((feeRows ?? []).map((fee) => [fee.id, fee]));
    const studentsById = new Map((studentRows ?? []).map((student) => [student.id, student]));

    return paymentRows.flatMap((payment) => {
      const fee = feesById.get(payment.fee_id);
      if (!fee) return [];

      const student = studentsById.get(fee.student_id);
      const courseName = nestedName(student?.courses, 'Curso');

      return [
        mapPendingPaymentReview(
          payment,
          {
            id: fee.id,
            studentId: fee.student_id,
            concept: fee.concept,
            dueDate: '',
            totalAmount: 0,
            paidAmount: 0,
            status: 'en_revision',
          },
          student ? `${student.first_name} ${student.paternal_surname}` : 'Estudiante',
          courseName,
        ),
      ];
    });
  } catch (error) {
    throw toRepositoryError(error, 'Error al listar pagos en revisión');
  }
}

export async function reviewPayment(
  mode: 'demo' | 'supabase',
  paymentId: string,
  approve: boolean,
  reason?: string,
) {
  if (mode === 'demo') {
    return;
  }

  try {
    const client = getSupabase();
    const { error } = await client.rpc('review_payment', {
      target_payment_id: paymentId,
      approve,
      reason: reason ?? null,
    });

    if (error) {
      throw new RepositoryError(
        approve ? 'No se pudo aprobar el pago' : 'No se pudo rechazar el pago',
        error,
      );
    }
  } catch (error) {
    throw toRepositoryError(error, 'Error al revisar el pago');
  }
}

export async function createPaymentInReview(
  mode: 'demo' | 'supabase',
  input: {
    feeId: string;
    amount: number;
    reference: string;
    userId: string;
  },
) {
  if (mode === 'demo') {
    return `payment-demo-${Date.now()}`;
  }

  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('payments')
      .insert({
        fee_id: input.feeId,
        submitted_by: input.userId,
        amount: input.amount,
        paid_at: new Date().toISOString(),
        method: 'transferencia',
        reference: input.reference,
        status: 'en_revision',
      })
      .select('id, amount')
      .single();

    if (error || !data) {
      throw new RepositoryError('No se pudo registrar el pago', error);
    }

    return data.id;
  } catch (error) {
    throw toRepositoryError(error, 'Error al crear el pago');
  }
}

export function remainingAmount(fee: { totalAmount: number; paidAmount: number }) {
  return Math.max(fee.totalAmount - fee.paidAmount, 0);
}

export function normalizePaymentAmount(value: number | string) {
  return toNumber(value);
}
