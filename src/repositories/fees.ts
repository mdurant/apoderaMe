import { demoFees, demoStudents } from '@/data/demo';
import type { FeeWithStudent } from '@/domain/models';
import { getSupabase } from '@/lib/supabase';
import { mapFeeRow } from '@/repositories/mappers';
import { RepositoryError, toRepositoryError } from '@/repositories/errors';

function buildDemoFees(): FeeWithStudent[] {
  return demoFees.map((fee) => {
    const student = demoStudents.find((item) => item.id === fee.studentId);
    return {
      ...fee,
      studentName: student ? `${student.firstName} ${student.paternalSurname}` : 'Estudiante',
      courseName: student?.courseName ?? 'Curso',
      schoolId: 'school-demo-001',
      courseId: student?.courseId ?? 'course-demo',
    };
  });
}

export async function listFeesWithStudents(mode: 'demo' | 'supabase'): Promise<FeeWithStudent[]> {
  if (mode === 'demo') {
    return buildDemoFees();
  }

  try {
    const client = getSupabase();
    const { data: feeRows, error: feesError } = await client
      .from('fees')
      .select('id, course_id, student_id, concept, due_date, total_amount, status')
      .order('due_date', { ascending: true });

    if (feesError) {
      throw new RepositoryError('No se pudieron cargar las cuotas', feesError);
    }

    if (!feeRows?.length) {
      return [];
    }

    const studentIds = [...new Set(feeRows.map((fee) => fee.student_id))];
    const feeIds = feeRows.map((fee) => fee.id);

    const [{ data: studentRows, error: studentsError }, { data: paymentRows, error: paymentsError }] =
      await Promise.all([
        client
          .from('students')
          .select(
            'id, course_id, school_id, first_name, paternal_surname, maternal_surname, courses(name)',
          )
          .in('id', studentIds),
        client.from('payments').select('id, fee_id, amount, status').in('fee_id', feeIds),
      ]);

    if (studentsError) {
      throw new RepositoryError('No se pudieron cargar los estudiantes', studentsError);
    }

    if (paymentsError) {
      throw new RepositoryError('No se pudieron cargar los pagos', paymentsError);
    }

    const studentsById = new Map((studentRows ?? []).map((student) => [student.id, student]));

    return feeRows.flatMap((fee) => {
      const student = studentsById.get(fee.student_id);
      if (!student) return [];
      return [mapFeeRow(fee, student, paymentRows ?? [])];
    });
  } catch (error) {
    throw toRepositoryError(error, 'Error al listar cuotas');
  }
}
