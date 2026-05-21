# Copilot Instructions – Sistema Medallero Federativo

## Arquitectura general

Monorepo con dos apps bajo `apps/`:
- **`apps/api/`** – Express + TypeScript + Prisma ORM → PostgreSQL (Supabase). Puerto 3000.
- **`apps/web/`** – React + Vite + TypeScript + React Bootstrap. Puerto 5173.

Desde raíz: `npm run dev` levanta ambos. `npm run dev:api` / `npm run dev:web` por separado.

## Stack de datos

- **PostgreSQL en Supabase** con Prisma. Schema en `apps/api/prisma/schema.prisma`.
- Las **medallas NO se almacenan** – se calculan dinámicamente desde `Result` (phase + position).
- `Athlete.photoData` es `Bytes` (BYTEA en Postgres) – la foto se guarda en la BD, no en disco ni Supabase Storage.
- `clubHistory` en `Athlete` es `Json` (`[]`), array de `{ clubId, clubName, from, to }`.

## Patrones del backend

- Estructura: `routes → controllers → services → prisma`. Nunca acceder a `prisma` directamente desde controllers.
- Errores: lanzar `BadRequestError`, `NotFoundError`, `ForbiddenError` de `utils/errors.ts`. El `asyncHandler` los captura.
- Respuestas: usar siempre `sendSuccess`, `sendCreated`, `sendPaginated` de `utils/response.ts`.
- Validación de body: Zod schemas en `validation/schemas.ts`, aplicados con `validateBody()` en la ruta.
- Auth: `requireAuth` (JWT), `requireAdmin` (rol ADMIN o SUPER_ADMIN). Rutas públicas de lectura no llevan middleware.
- Upload de archivos: `multer.memoryStorage()` → buffer en `req.file.buffer` → se guarda con `uploadAthletePhoto()` de `storage.service.ts`.

## Endpoint de fotos de atletas

```
POST /api/athletes/:id/photo   → sube foto (multipart, campo "photo", max 5MB, jpeg/png/webp)
GET  /api/athletes/:id/photo   → sirve la imagen con Content-Type correcto (sin auth)
```

La URL de la foto en el frontend siempre es `/api/athletes/:id/photo`. El campo `photoUrl` en la tabla es legacy; la fuente de verdad es `photoData` (BYTEA).

## Patrones del frontend

- Cliente HTTP: `apps/web/src/api/client.ts` – instancia Axios con interceptor de token JWT.
- Todas las llamadas van por los objetos exportados: `athletesApi`, `clubsApi`, `eventsApi`, etc.
- Para `multipart/form-data` (fotos): `athletesApi.uploadPhoto(id, file)` – ya setea el header correcto.
- Paginación de atletas: **client-side** (carga hasta 500 en memoria, filtra y pagina localmente).
- Errores HTTP: normalizar con la función `formatError(err)` que ya existe en cada página admin.
- Componente `AthleteAvatar` en `AdminAthletes.tsx`: intenta cargar desde el endpoint, hace `onError` a emoji fallback.

## Reglas de negocio críticas

- **Medallero de clubes** solo incluye eventos con `clubMedalsEnabled = true` y nivel `WA_STANDARD` o `INDOOR_STANDARD`. Atletas independientes (`clubId = null`) quedan excluidos.
- **ORO** = phase FINAL + position 1 · **PLATA** = FINAL + position 2 · **BRONCE** = BRONZE_MATCH + position 1.
- Un atleta puede no tener club activo pero tener historial de clubes anteriores en `clubHistory`.

## Variables de entorno

Backend (`apps/api/.env`): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:5173`.
Frontend (`apps/web/.env`): `VITE_API_URL=/api` (proxied por Vite en dev) o URL absoluta en producción.

## Comandos útiles

```bash
npm run dev                  # Levanta API + Web
npm run db:generate          # Regenera cliente Prisma tras cambios en schema
npm run db:migrate           # Aplica migraciones pendientes
npm run db:seed              # Crea admin inicial y datos base
```

## Archivos clave

| Archivo | Rol |
|---|---|
| `apps/api/prisma/schema.prisma` | Fuente de verdad del modelo de datos |
| `apps/api/src/app.ts` | Config Express (CORS, rate limit, body parser) |
| `apps/api/src/services/storage.service.ts` | Upload/get/delete foto BYTEA |
| `apps/web/src/api/client.ts` | Tipos TS + todos los métodos de API |
| `apps/web/src/pages/admin/AdminAthletes.tsx` | Gestión completa de atletas + subida de foto |
