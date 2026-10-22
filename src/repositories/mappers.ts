import type {
  AppAccount,
  AppAccess,
  Fee,
  FeeWithStudent,
  PaymentStatus,
  PendingPaymentReview,
  SchoolSummary,
  Student,
  UserRole,
} from '@/domain/models';

type FeeRow = {
  id: string;
  course_id: string;
  student_id: string;
  concept: string;
  due_date: string;
  total_amount: number | string;
  status: PaymentStatus;
};

type PaymentRow = {
  id: string;
  fee_id: string;
  amount: number | string;
  status: PaymentStatus;
};

type StudentRow = {
  id: string;
  course_id: string;
  school_id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string | null;
  courses?: { name: string } | { name: string }[] | null;
};

type ProfileRow = {
  id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string | null;
  email: string;
  phone: string | null;
};

type SchoolRow = {
  id: string;
  name: string;
  commune: string;
  region: string;
  email: string | null;
  phone: string | null;
};

const courseRoleLabels: Partial<Record<UserRole, string>> = {
  tesorero: 'Tesorero de curso',
  presidente: 'Presidente de curso',
  secretario: 'Secretario de curso',
  profesor_jefe: 'Profesor jefe',
};

export function toNumber(value: number | string) {
  return typeof value === 'number' ? value : Number(value);
}

export function initialsFromName(firstName: string, paternalSurname: string) {
  return `${firstName.slice(0, 1)}${paternalSurname.slice(0, 1)}`.toUpperCase();
}

function courseNameFromRow(row: StudentRow) {
  return nestedName(row.courses, 'Curso');
}

export function nestedName<T extends { name: string }>(
  value: T | T[] | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0]?.name ?? fallback;
  return value.name;
}

export function mapFeeRow(
  fee: FeeRow,
  student: StudentRow,
  payments: PaymentRow[],
): FeeWithStudent {
  const paidAmount = payments
    .filter((payment) => payment.fee_id === fee.id && payment.status === 'pagado')
    .reduce((total, payment) => total + toNumber(payment.amount), 0);

  return {
    id: fee.id,
    studentId: fee.student_id,
    concept: fee.concept,
    dueDate: fee.due_date,
    totalAmount: toNumber(fee.total_amount),
    paidAmount,
    status: fee.status,
    studentName: `${student.first_name} ${student.paternal_surname}`,
    courseName: courseNameFromRow(student),
    schoolId: student.school_id,
    courseId: fee.course_id,
  };
}

export function mapStudentRow(row: StudentRow): Student {
  return {
    id: row.id,
    firstName: row.first_name,
    paternalSurname: row.paternal_surname,
    maternalSurname: row.maternal_surname ?? '',
    rut: '',
    courseId: row.course_id,
    courseName: courseNameFromRow(row),
  };
}

export function mapSchoolRow(row: SchoolRow): SchoolSummary {
  return {
    id: row.id,
    name: row.name,
    commune: row.commune,
    region: row.region,
    email: row.email ?? '',
    phone: row.phone ?? '',
  };
}

export function buildAppAccount(
  profile: ProfileRow,
  access: AppAccess,
  roleLabel: string,
  scopeLabel: string,
): AppAccount {
  return {
    id: profile.id,
    access,
    firstName: profile.first_name,
    paternalSurname: profile.paternal_surname,
    maternalSurname: profile.maternal_surname ?? '',
    rut: '',
    email: profile.email,
    phone: profile.phone ?? '',
    roleLabel,
    scopeLabel,
    initials: initialsFromName(profile.first_name, profile.paternal_surname),
  };
}

export function courseRoleLabel(role: UserRole) {
  return courseRoleLabels[role] ?? 'Directiva de curso';
}

export function mapPendingPaymentReview(
  payment: {
    id: string;
    fee_id: string;
    amount: number | string;
    paid_at: string;
    reference: string | null;
  },
  fee: Fee,
  studentName: string,
  courseName: string,
): PendingPaymentReview {
  return {
    id: payment.id,
    feeId: payment.fee_id,
    amount: toNumber(payment.amount),
    paidAt: payment.paid_at,
    reference: payment.reference ?? 'Sin referencia',
    studentName,
    courseName,
    concept: fee.concept,
  };
}
