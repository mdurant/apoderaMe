# Arquitectura MVP de ApoderaMe

## Decisión principal

El frontend oficial será la aplicación universal existente en **Expo SDK 57**, con Android, iOS y web desde una sola base de código. No se iniciará un segundo frontend en Next.js mientras no exista una necesidad web que Expo Router no pueda cubrir. Esto evita duplicar navegación, validaciones y experiencia de usuario durante el MVP.

El backend será **Supabase**:

- PostgreSQL para datos transaccionales.
- Auth para identidad y sesiones.
- Storage privado para comprobantes y documentos.
- Realtime para cambios de asistencia, pagos y notificaciones internas.
- Edge Functions para operaciones privilegiadas e integraciones externas.

## Alcance del primer MVP

### Apoderados

1. Inicio con resumen por estudiante.
2. Confirmación de asistencia.
3. Cuotas, abonos y carga de comprobantes.
4. Actividades, presupuesto y gastos transparentes.
5. Perfil, apariencia y solicitudes de privacidad.

### Directiva

1. Revisión de pagos.
2. Gestión de actividades y gastos.
3. Resumen por curso.
4. Notificaciones internas.

La administración completa del colegio, WhatsApp, exportaciones y analítica avanzada quedan después de validar estos flujos.

## Identidad y autenticación

El RUT es un dato personal y un identificador, no una contraseña.

La propuesta original “RUT + últimos cuatro dígitos” no se implementará porque:

- el espacio de búsqueda tiene solo 10.000 combinaciones;
- los intentos podrían automatizarse;
- el dato puede ser conocido por terceros;
- no entrega resistencia suficiente ante filtraciones.

Flujo recomendado:

1. La persona ingresa su RUT.
2. Una Edge Function normaliza el RUT, aplica rate limiting y busca una referencia HMAC usando un secreto exclusivo del servidor.
3. Si existe una cuenta, se envía un Magic Link u OTP al correo o teléfono previamente verificado.
4. Supabase Auth crea la sesión.
5. Todas las consultas posteriores se autorizan mediante RLS.

Nunca se debe incluir `service_role`, secretos HMAC ni credenciales de WhatsApp en la app Expo.

## Modelo de autorización

Los permisos se asignan en dos niveles:

- `school_memberships`: administración del establecimiento.
- `course_roles`: profesor jefe y directiva de un curso.

La relación `guardian_students` determina qué estudiantes puede ver cada apoderado. Las políticas RLS usan funciones pequeñas y auditables:

- `is_school_admin`
- `is_course_staff`
- `is_course_treasurer`
- `is_guardian_of`
- `can_access_course`

El cliente nunca decide si una persona “es tesorera”; solamente presenta lo que la base ya autorizó.

## Dinero

Todos los montos se almacenan como enteros en pesos chilenos. No se usan valores decimales ni `float`.

- `fees.total_amount`: monto total de la cuota.
- `payments.amount`: cada abono presentado.
- el saldo se calcula desde pagos aprobados;
- un comprobante no implica pago aprobado;
- tesorería registra quién revisó y cuándo.

Las operaciones que cambien saldos o estados múltiples deben ejecutarse mediante funciones SQL transaccionales, no con varias escrituras independientes desde el teléfono.

## Comprobantes

Storage debe utilizar un bucket privado. La ruta recomendada es:

`colegio/{school_id}/curso/{course_id}/pago/{payment_id}/{uuid}.{extension}`

Restricciones iniciales:

- JPEG, PNG o PDF.
- Máximo 10 MB.
- Lectura: apoderado que lo subió y tesorería del curso.
- Escritura: apoderado relacionado con el estudiante.
- No exponer URLs públicas permanentes; usar URLs firmadas de corta duración.

## Auditoría

Se auditan actividades, asistencias, cuotas, pagos, gastos y solicitudes de privacidad. El log registra:

- tabla y registro;
- operación;
- usuario autenticado;
- valores antes y después;
- fecha en UTC.

Los logs son de solo lectura para administradores autorizados y no deben enviarse a herramientas externas sin anonimización.

## Privacidad en Chile

A julio de 2026 continúa vigente la Ley 19.628. La Ley 21.719 fue publicada el 13 de diciembre de 2024 y entra en vigencia plena el **1 de diciembre de 2026**. El producto se diseña desde ahora para ambos marcos.

La app debe informar permanentemente:

- responsable del tratamiento;
- categorías de datos;
- finalidades y bases de licitud;
- destinatarios;
- plazos de conservación;
- datos de contacto para solicitudes;
- medidas generales de seguridad;
- transferencias internacionales, incluida la infraestructura de Supabase.

El flujo de solicitudes contempla acceso, rectificación, supresión, oposición, portabilidad y bloqueo. La implementación debe ser revisada por asesoría jurídica chilena antes del uso productivo, especialmente por tratar datos de niños, niñas y adolescentes.

## Datos demo

Todos los datos incluidos en `src/data/demo.ts` son ficticios:

- RUT con dígito verificador válido, sin asociarlos a personas reales conocidas.
- Teléfonos no operativos con numeración de demostración.
- Correos bajo el dominio reservado `.invalid`.
- Montos en CLP.
- Fechas interpretadas en `America/Santiago`.

Nunca copiar bases de apoderados reales a ambientes de desarrollo.

## Próximos pasos técnicos

1. Crear un proyecto Supabase por ambiente.
2. Ejecutar migraciones y revisar RLS con pruebas de usuarios cruzados.
3. Configurar `.env` desde `.env.example`.
4. Implementar Auth con OTP/Magic Link.
5. Reemplazar repositorios demo por repositorios Supabase.
6. Crear bucket privado y políticas de Storage.
7. Añadir pruebas unitarias, integración y E2E.
8. Realizar revisión de seguridad y privacidad antes del piloto.
