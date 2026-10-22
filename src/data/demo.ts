import type {
  Attendance,
  DemoAccount,
  Fee,
  NotificationItem,
  Payment,
  SchoolActivity,
  Student,
} from '@/domain/models';

/**
 * Datos completamente ficticios para desarrollo y demostraciones.
 * No corresponden a personas, estudiantes ni establecimientos reales.
 */
export const demoAccounts: DemoAccount[] = [
  {
    id: 'demo-apoderado',
    access: 'apoderado',
    firstName: 'Mauricio',
    paternalSurname: 'Durán',
    maternalSurname: 'Torres',
    rut: '17.654.321-3',
    email: 'mauricio.duran@mi-colegio.com',
    phone: '+56 9 0000 0001',
    roleLabel: 'Apoderado',
    scopeLabel: 'Fernanda y Benjamín · 2 cursos',
    initials: 'CR',
  },
  {
    id: 'demo-directiva',
    access: 'directiva',
    firstName: 'Diego',
    paternalSurname: 'Soto',
    maternalSurname: 'Araya',
    rut: '12.345.678-5',
    email: 'diego.soto@mi-colegio.com',
    phone: '+56 9 0000 0002',
    roleLabel: 'Tesorero de curso',
    scopeLabel: '5° Básico B · Directiva 2026',
    initials: 'DS',
  },
  {
    id: 'demo-colegio',
    access: 'colegio',
    firstName: 'Valentina',
    paternalSurname: 'Muñoz',
    maternalSurname: 'Contreras',
    rut: '9.876.543-3',
    email: 'valentina.munoz@mi-colegio.com',
    phone: '+56 2 2000 0002',
    roleLabel: 'Administradora del colegio',
    scopeLabel: 'Colegio Valle Cordillera',
    initials: 'VM',
  },
];

export const demoStudents: Student[] = [
  {
    id: 'student-demo-001',
    firstName: 'Martina',
    paternalSurname: 'Soto',
    maternalSurname: 'Rojas',
    rut: '22.123.456-1',
    courseId: 'course-demo-5b',
    courseName: '5° Básico B',
  },
  {
    id: 'student-demo-002',
    firstName: 'Benjamín',
    paternalSurname: 'Soto',
    maternalSurname: 'Rojas',
    rut: '20.345.678-6',
    courseId: 'course-demo-2a',
    courseName: '2° Básico A',
  },
];

export const demoActivities: SchoolActivity[] = [
  {
    id: 'activity-demo-001',
    courseId: 'course-demo-5b',
    title: 'Salida pedagógica al MIM',
    description: 'Visita guiada al Museo Interactivo Mirador con el 5° Básico B.',
    location: 'Av. Punta Arenas 6711, La Granja',
    startsAt: '2026-07-29T09:00:00-04:00',
    status: 'proxima',
    estimatedAmount: 650000,
    collectedAmount: 520000,
  },
  {
    id: 'activity-demo-002',
    courseId: 'course-demo-2a',
    title: 'Convivencia de invierno',
    description: 'Actividad de curso organizada por la directiva y el profesor jefe.',
    location: 'Sala multiuso del colegio',
    startsAt: '2026-08-07T16:30:00-04:00',
    status: 'proxima',
    estimatedAmount: 180000,
    collectedAmount: 126000,
  },
  {
    id: 'activity-demo-003',
    courseId: 'course-demo-5b',
    title: 'Bingo solidario',
    description: 'Jornada para reunir fondos para la gira de estudios.',
    location: 'Gimnasio del colegio',
    startsAt: '2026-08-22T15:00:00-04:00',
    status: 'proxima',
    estimatedAmount: 420000,
    collectedAmount: 294000,
  },
];

export const demoAttendances: Attendance[] = [
  {
    id: 'attendance-demo-001',
    activityId: 'activity-demo-001',
    studentId: 'student-demo-001',
    status: 'sin_responder',
    respondedAt: null,
  },
  {
    id: 'attendance-demo-002',
    activityId: 'activity-demo-002',
    studentId: 'student-demo-002',
    status: 'asistire',
    respondedAt: '2026-07-17T18:42:00-04:00',
  },
];

export const demoFees: Fee[] = [
  {
    id: 'fee-demo-001',
    studentId: 'student-demo-001',
    concept: 'Cuota de curso · julio',
    dueDate: '2026-07-31',
    totalAmount: 15000,
    paidAmount: 0,
    status: 'pendiente',
  },
  {
    id: 'fee-demo-002',
    studentId: 'student-demo-001',
    concept: 'Salida pedagógica al MIM',
    dueDate: '2026-07-24',
    totalAmount: 18000,
    paidAmount: 10000,
    status: 'parcial',
  },
  {
    id: 'fee-demo-003',
    studentId: 'student-demo-002',
    concept: 'Cuota de curso · julio',
    dueDate: '2026-07-31',
    totalAmount: 12000,
    paidAmount: 12000,
    status: 'pagado',
  },
];

export const demoPayments: Payment[] = [
  {
    id: 'payment-demo-001',
    feeId: 'fee-demo-003',
    amount: 12000,
    paidAt: '2026-07-12T11:05:00-04:00',
    status: 'pagado',
    method: 'transferencia',
    reference: 'Transferencia BancoEstado · comprobante 001',
  },
  {
    id: 'payment-demo-002',
    feeId: 'fee-demo-002',
    amount: 10000,
    paidAt: '2026-07-16T19:22:00-04:00',
    status: 'en_revision',
    method: 'transferencia',
    reference: 'Transferencia CuentaRUT · comprobante 002',
  },
];

export const demoNotifications: NotificationItem[] = [
  {
    id: 'notification-demo-001',
    title: 'Confirma la asistencia de Martina',
    body: 'La salida pedagógica al MIM necesita respuesta antes del 24 de julio.',
    createdAt: '2026-07-18T09:30:00-04:00',
    read: false,
    kind: 'asistencia',
  },
  {
    id: 'notification-demo-002',
    title: 'Comprobante recibido',
    body: 'La tesorería está revisando tu abono de $10.000.',
    createdAt: '2026-07-16T19:24:00-04:00',
    read: true,
    kind: 'pago',
  },
];

export const demoSchool = {
  id: 'school-demo-001',
  name: 'Colegio Valle Cordillera',
  commune: 'Puente Alto',
  region: 'Región Metropolitana de Santiago',
  email: 'contacto@colegio-mi-colegio.com',
  phone: '+56 2 2000 0001',
} as const;
