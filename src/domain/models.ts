export type Id = string;

export type UserRole =
  | 'apoderado'
  | 'presidente'
  | 'tesorero'
  | 'secretario'
  | 'profesor_jefe'
  | 'admin_colegio';

export type PaymentStatus = 'pendiente' | 'parcial' | 'en_revision' | 'pagado' | 'rechazado';
export type AttendanceStatus = 'asistire' | 'no_asistire' | 'sin_responder';
export type ActivityStatus = 'proxima' | 'en_curso' | 'finalizada' | 'cancelada';

export type Guardian = {
  id: Id;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
  email: string;
  phone: string;
  roles: UserRole[];
};

export type Student = {
  id: Id;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
  courseId: Id;
  courseName: string;
};

export type SchoolActivity = {
  id: Id;
  courseId: Id;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  status: ActivityStatus;
  estimatedAmount: number;
  collectedAmount: number;
};

export type Attendance = {
  id: Id;
  activityId: Id;
  studentId: Id;
  status: AttendanceStatus;
  respondedAt: string | null;
};

export type Fee = {
  id: Id;
  studentId: Id;
  concept: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
};

export type Payment = {
  id: Id;
  feeId: Id;
  amount: number;
  paidAt: string;
  status: PaymentStatus;
  method: 'transferencia' | 'efectivo' | 'otro';
  reference: string;
};

export type NotificationItem = {
  id: Id;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: 'pago' | 'actividad' | 'asistencia' | 'general';
};

export type AppAccess = 'apoderado' | 'directiva' | 'colegio';

/** @deprecated Usa AppAccess */
export type DemoAccess = AppAccess;

export type AppAccount = {
  id: Id;
  access: AppAccess;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
  email: string;
  phone: string;
  roleLabel: string;
  scopeLabel: string;
  initials: string;
};

/** @deprecated Usa AppAccount */
export type DemoAccount = AppAccount;

export type AppSession = {
  mode: 'demo' | 'supabase';
  account: AppAccount;
};

export type FeeWithStudent = Fee & {
  studentName: string;
  courseName: string;
  schoolId: Id;
  courseId: Id;
};

export type PendingPaymentReview = {
  id: Id;
  feeId: Id;
  amount: number;
  paidAt: string;
  reference: string;
  studentName: string;
  courseName: string;
  concept: string;
};

export type SchoolSummary = {
  id: Id;
  name: string;
  commune: string;
  region: string;
  email: string;
  phone: string;
};
