# ApoderaMe

Aplicación chilena para conectar **apoderados**, **directivas de curso** y **colegios**. El MVP concentra asistencias, cuotas, comprobantes y actividades por curso en una experiencia universal (Android, iOS y web) accesible y alineada con formatos locales.

> Los datos demo incluidos son ficticios y se usan solo para desarrollo. Los correos de demostración usan el dominio `.invalid` y no generan comunicaciones reales.

---

## Contacto

| Rol | Nombre | Organización | Correo |
|-----|--------|--------------|--------|
| CTO | Mauricio Durán | IntegralTech Spa | [mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com) |

Para consultas técnicas, despliegue o acceso al proyecto Supabase de desarrollo, escribe a la dirección anterior.

---

## Descripción

### Qué resuelve

ApoderaMe reduce la fricción entre la comunidad escolar:

| Rol | Capacidad principal en el MVP |
|-----|-------------------------------|
| **Apoderado** | Ver cuotas, subir comprobantes, confirmar asistencias y consultar actividades de sus estudiantes. |
| **Directiva** | Revisar recaudación, aprobar o rechazar pagos (`review_payment`) y seguir el estado del curso. |
| **Colegio** | Supervisar el establecimiento, cursos y alcance administrativo. |

### Alcance funcional actual

- Login dual: **Cuenta QA** (Supabase Auth + PostgreSQL + RLS) y **Demo visual** (sesión en memoria).
- Dashboard, asistencias, pagos, actividades y perfil adaptados por rol.
- Temas Light/Dark con tokens semánticos.
- Formatos `es-CL`, montos en CLP sin decimales y zona `America/Santiago`.
- RUT enmascarado en UI; no se usa como contraseña.
- Comprobantes en bucket privado `payment-receipts` con ruta `{school_id}/{course_id}/{payment_id}/{uuid}.{ext}`.

### Arquitectura técnica

```text
Expo SDK 57 (Android · iOS · web)
  → repositorios (src/repositories/)
  → cliente único Supabase (src/lib/supabase.ts)
  → Auth / PostgREST / Storage
  → PostgreSQL con RLS + RPC review_payment
```

| Capa | Tecnología |
|------|------------|
| Frontend | Expo SDK 57, React Native 0.86, Expo Router, TypeScript estricto |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions futuras) |
| Dominio | `src/domain/models.ts` + repositorios (pantallas no importan Supabase directo) |
| Utilidades CL | `src/utils/chile.ts` (RUT, CLP, fechas civiles) |
| Calidad | `npm run lint`, `npx tsc --noEmit`, `npm test` (Vitest) |

Documentación de diseño: [`docs/ARQUITECTURA_MVP.md`](docs/ARQUITECTURA_MVP.md).

### Proyecto Supabase de desarrollo

```text
Project ref: tcnfllpwpiwrysjmfpwe
API URL:     https://tcnfllpwpiwrysjmfpwe.supabase.co
```

La app **nunca** se conecta al puerto PostgreSQL 5432 desde el dispositivo. Solo usa HTTPS + publishable key. La CLI o un backend seguro usan la cadena SSL fuera del bundle Expo.

---

## Configuración local

### Requisitos

- Node.js `^22.13.0` o `>=24.3.0` (ver `package.json` y `.nvmrc`).
- npm.
- Expo Go compatible con SDK 57 o Development Build.
- (Opcional) Docker para Supabase local.
- (Opcional) Supabase CLI vía `npx supabase@latest`.

### Instalación

```bash
nvm use
npm install
cp .env.example .env
```

Edita `.env` solo con variables públicas:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://tcnfllpwpiwrysjmfpwe.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REEMPLAZAR_DESDE_SUPABASE
```

La publishable key se obtiene en **Supabase Dashboard → Project Settings → API Keys**.

### Variables prohibidas en Expo

No agregues al cliente ni con prefijo `EXPO_PUBLIC_`:

```text
SUPABASE_DB_PASSWORD
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
DATABASE_URL
```

### Arranque

```bash
npx expo start --clear
```

Plataformas:

```bash
npm run android
npm run ios
npm run web
```

Sin `.env` válido la app sigue funcionando en **Demo visual**. Con Supabase configurado aparece la pestaña **Cuenta QA**.

### Persistencia de sesión

| Plataforma | Almacenamiento Auth |
|------------|---------------------|
| iOS / Android | Polyfill `localStorage` vía `expo-sqlite` (`src/lib/auth-storage.native.ts`) |
| Web | `window.localStorage` (`src/lib/auth-storage.web.ts`) |

### PostgreSQL vía Supabase CLI

```bash
npx supabase@latest login
npx supabase@latest link --project-ref tcnfllpwpiwrysjmfpwe
npx supabase@latest migration list
npx supabase@latest db push --dry-run
npx supabase@latest db push
npx supabase@latest db lint --linked
```

Migraciones:

```text
supabase/migrations/202607180001_initial_schema.sql
supabase/migrations/202607180002_receipts_storage.sql
```

Desarrollo local opcional (Docker):

```bash
npx supabase@latest start
npx supabase@latest db reset
npx supabase@latest status
npx supabase@latest stop
```

No ejecutes `db reset` contra el proyecto remoto.

### Verificación de calidad

```bash
npm run lint
npx tsc --noEmit
npm test
```

Tras cambios de rutas o navegación:

```bash
npx expo export --platform web
```

---

## Configuración con Google Cloud Platform (GCP)

ApoderaMe puede desplegarse o apoyarse en GCP sin reemplazar Supabase como backend de datos. Uso recomendado:

### Casos de uso

| Servicio GCP | Uso sugerido |
|--------------|--------------|
| **Cloud Storage** | Respaldo de artefactos de build (`dist/`, exports EAS). |
| **Secret Manager** | `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, contraseñas CI (nunca en Expo). |
| **Cloud Build / Cloud Run** | Pipeline de lint/test/export web o servir el build estático web detrás de Cloud Run + CDN. |
| **Artifact Registry** | Imágenes de workers o Edge runners auxiliares. |
| **Cloud Logging / Monitoring** | Observabilidad de jobs administrativos (no del RLS de cliente). |
| **Identity-Aware Proxy** | Restringir paneles internos o dashboards de operación. |

### Ejemplo: secrets en GCP

```bash
gcloud secrets create apoderaame-database-url --replication-policy=automatic
echo -n "postgresql://postgres:...@db....supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets versions add apoderaame-database-url --data-file=-
```

En Cloud Build, inyecta el secret al paso de migraciones o tests de integración; **no** lo pases a variables `EXPO_PUBLIC_*`.

### Ejemplo: export web hacia Cloud Storage + Load Balancer

```bash
npx expo export --platform web
gsutil -m rsync -r dist gs://TU-BUCKET-APODERAME-WEB/
```

Configura HTTPS, headers de caché y redirects hacia `index.html` según el enrutado de Expo Router.

### Buenas prácticas GCP + Supabase

1. El origen de verdad transaccional sigue siendo PostgreSQL de Supabase.
2. GCP aloja builds, secretos y jobs; no duplica el esquema sin decisión arquitectónica.
3. Usa cuentas de servicio con privilegios mínimos.
4. Rota secretos si se filtran por chat o logs.

---

## Configuración con Amazon Web Services (AWS)

Misma lógica: AWS complementa el despliegue y la operación; Supabase permanece como BaaS del MVP.

### Casos de uso

| Servicio AWS | Uso sugerido |
|--------------|--------------|
| **S3** | Hosting del export web estático o respaldos de build. |
| **CloudFront** | CDN delante del sitio web Expo. |
| **Secrets Manager / SSM Parameter Store** | Credenciales de CI, `DATABASE_URL`, service role. |
| **CodeBuild / CodePipeline** | Lint, test, `expo export`, publicación a S3. |
| **ECS / Lambda** | Workers administrativos o sincronizaciones (sin `service_role` en el móvil). |
| **WAF** | Protección del origen web público. |
| **CloudWatch** | Métricas y alarmas de pipelines. |

### Ejemplo: publicar web en S3 + CloudFront

```bash
npx expo export --platform web
aws s3 sync dist/ s3://TU-BUCKET-APODERAME-WEB/ --delete
aws cloudfront create-invalidation --distribution-id TU_DISTRIBUTION_ID --paths "/*"
```

### Ejemplo: secret en AWS

```bash
aws secretsmanager create-secret \
  --name apoderaame/database-url \
  --secret-string 'postgresql://postgres:...@db....supabase.co:5432/postgres?sslmode=require'
```

### EAS Build (Expo) junto a AWS/GCP

Para binarios nativos se recomienda **EAS Build**. Guarda los secretos de firma y las keys de tiendas en el gestor de la nube (AWS Secrets Manager o GCP Secret Manager) y referéncialos desde el pipeline; no los commits al repositorio.

### Buenas prácticas AWS + Supabase

1. No abras el puerto 5432 de Supabase a Internet sin necesidad; usa Pooler y redes controladas.
2. El cliente móvil solo recibe URL + publishable key.
3. Aprobación de pagos y onboarding privilegiado viven en RPC / Edge Functions, no en Lambda expuesta sin Auth.

---

## Datos de prueba

### Demo visual (sin autenticación real)

En el login elige **Demo visual**. Sesiones solo en memoria; correos `.invalid`; RUT enmascarado.

| Perfil | Persona ficticia | Enfoque |
|--------|------------------|---------|
| Apoderado | Camila Rojas | Estudiantes, cuotas, asistencias |
| Directiva | Diego Soto | Tesorería 5° Básico B |
| Colegio | Valentina Muñoz | Administración del establecimiento |

Colegio demo: **Colegio Valle Cordillera**, Puente Alto.

Definidos en `src/data/demo.ts`.

### Cuenta QA (Supabase Auth + PostgreSQL)

En el login elige **Cuenta QA** e ingresa correo/contraseña de un usuario creado en **Authentication → Users**.

Referencia de apoderado ya documentada en el entorno de desarrollo:

```text
UUID apoderado Auth: 955f2919-68f7-4ac5-9add-4b7f939d015a
```

Debes completar en SQL Editor (orden 8.1–8.8 histórico del proyecto):

1. `schools`
2. `profiles` (mismo UUID que Auth)
3. `private.person_identifiers` (RUT normalizado)
4. `school_memberships` / `course_roles`
5. `courses`, `students`
6. `guardian_students`
7. `fees` (y opcionalmente `payments` / comprobantes)

Consulta de verificación:

```sql
select id, name from public.schools;
select id, name, school_id from public.courses;
select id, first_name, paternal_surname, course_id from public.students;
select guardian_id, student_id, relationship from public.guardian_students;
select id, concept, status, total_amount from public.fees order by created_at desc;
```

### Flujo de prueba: subir comprobante

1. Login **Cuenta QA** como apoderado.
2. Pantalla **Pagos** debe indicar origen **PostgreSQL**.
3. **Subir comprobante** → PDF/JPEG/PNG ≤ 10 MB.
4. Se crea `payments` (`en_revision`), upload a `payment-receipts` y fila en `receipts`.
5. Login como tesorero → **Aprobar** / **Rechazar** vía RPC `review_payment`.

### Auth Dashboard (redirects de desarrollo)

```text
Site URL: http://localhost:8081
Redirects:
  http://localhost:8081/auth/callback
  apoderame://auth/callback
```

### Storage

Bucket privado `payment-receipts`: 10 MB; MIME `image/jpeg`, `image/png`, `application/pdf`. Descargas solo con URL firmada de corta duración; no persistir URLs firmadas en PostgreSQL.

---

## Estructura relevante

```text
src/app/                 Pantallas (Expo Router)
src/components/          UI, SessionProvider, LoginScreen, tabs
src/data/demo.ts         Datos ficticios chilenos
src/domain/models.ts     Modelo de dominio
src/hooks/               useFees, usePendingPayments, useProfileData
src/lib/supabase.ts      Cliente único + auth-storage por plataforma
src/repositories/        fees, payments, receipts, profiles (capa datos)
src/utils/chile.ts       RUT, CLP, fechas
supabase/migrations/     Esquema, RLS, Storage
docs/                    Arquitectura MVP
.cursor/rules/           Convenciones del proyecto
```

---

## Seguridad y privacidad

- El RUT es dato personal, no contraseña. Flujo objetivo: RUT + OTP/Magic Link.
- RLS forzado en tablas públicas y privadas; identificadores sensibles en esquema `private`.
- Montos en `bigint` (pesos enteros).
- Auditoría y solicitudes de privacidad (Ley 21.719 en el horizonte de diseño).
- Rotar inmediatamente cualquier `service_role`, secret key o contraseña PostgreSQL expuesta.

Detalle: [`docs/ARQUITECTURA_MVP.md`](docs/ARQUITECTURA_MVP.md).

---

## Solución de problemas

| Síntoma | Acción |
|---------|--------|
| Expo Go incompatible | Instalar Expo Go para SDK 57 o usar Development Build |
| `.env` sin efecto | `npx expo start --clear` |
| `supabase` es `null` | Revisar `EXPO_PUBLIC_SUPABASE_*` |
| Error `wa-sqlite.wasm` en web | Usar `auth-storage.web.ts` (no importar `expo-sqlite` en web) |
| “Subir comprobante” sin feedback | Usar **Cuenta QA**; en demo el botón solo avisa |
| `permission denied` / lista vacía | Sesión, RLS y vínculos `guardian_students` / `course_roles` |
| SSL PostgreSQL | `sslmode=require` o Pooler de Supabase |
| Magic Link no llega | Redirects, SMTP y plantillas Auth |

---

## Licencia

Ver archivo [`LICENSE`](LICENSE).

---

**IntegralTech Spa** · Contacto técnico: Mauricio Durán · [mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com)
