# Patrón de almacenamiento de imágenes en BD (BYTEA)

## Contexto

El proyecto originalmente guardaba URLs de imágenes (fotos de atletas, logos de clubes) apuntando a Supabase Storage. Esas URLs fallaban con `ERR_NAME_NOT_RESOLVED` porque los tokens de acceso expiraban o el bucket no estaba configurado correctamente.

La solución adoptada fue almacenar la imagen directamente como `BYTEA` en PostgreSQL y servirla a través de un endpoint propio de la API.

---

## Modelo de datos

En `apps/api/prisma/schema.prisma`:

```prisma
model Athlete {
  // ...
  photoUrl      String?   // legacy — ya no se usa
  photoData     Bytes?    // imagen en BYTEA
  photoMimeType String?   // ej: "image/jpeg"
}

model Club {
  // ...
  logoUrl       String?   // legacy — ya no se usa
  logoData      Bytes?    // imagen en BYTEA
  logoMimeType  String?   // ej: "image/jpeg"
}
```

> **Importante:** al agregar `*Data`/`*MimeType` al schema hay que correr `npx prisma migrate dev --name <nombre>` desde `apps/api/`. Si solo se modifica el schema sin migrar, el campo no existe en la BD real y Prisma lanzará un error de runtime aunque el cliente TypeScript ya lo conozca.

---

## Endpoints de imagen

### Atletas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/athletes/:id/photo` | `requireAuth` + multer | Sube/reemplaza la foto |
| `GET` | `/api/athletes/:id/photo` | pública | Sirve la imagen |
| `DELETE` | `/api/athletes/:id/photo` | `requireAuth` | Elimina la foto |

### Clubes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/clubs/:id/logo` | `requireAuth` + `requireAdmin` + multer | Sube/reemplaza el logo |
| `GET` | `/api/clubs/:id/logo` | pública | Sirve la imagen |
| `DELETE` | `/api/clubs/:id/logo` | `requireAuth` + `requireAdmin` | Elimina el logo |

---

## Backend — patrón de implementación

### 1. Multer (en `routes/*.routes.ts`)

```typescript
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Formato no soportado'));
  },
});

router.post('/:id/photo', requireAuth, upload.single('photo'), uploadPhoto);
router.get('/:id/photo', getPhoto);
router.delete('/:id/photo', requireAuth, deletePhoto);
```

### 2. Service (`apps/api/src/services/*.service.ts`)

El select de `findAll` y `findById` **excluye** el campo `*Data` (que puede ser MB de bytes) pero incluye `*MimeType` para derivar el booleano `hasPhoto`/`hasLogo`:

```typescript
const ATHLETE_SELECT = {
  id: true,
  // ... otros campos ...
  photoMimeType: true,  // ← incluido para derivar hasPhoto
  // photoData: false   ← nunca se incluye en listas
} as const;

// En findAll/findById:
const athletes = raw.map(a => ({
  ...a,
  hasPhoto: a.photoMimeType !== null,
}));
```

Métodos de imagen en el service:

```typescript
async uploadPhoto(id: number, buffer: Buffer, mimeType: string) {
  return prisma.athlete.update({
    where: { id },
    data: { photoData: buffer, photoMimeType: mimeType },
  });
}

async getPhoto(id: number) {
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    select: { photoData: true, photoMimeType: true },
  });
  if (!athlete?.photoData) return null;
  return { photoData: athlete.photoData as Buffer, photoMimeType: athlete.photoMimeType! };
}

async deletePhoto(id: number) {
  return prisma.athlete.update({
    where: { id },
    data: { photoData: null, photoMimeType: null },
  });
}
```

### 3. Controller (`apps/api/src/controllers/*.controller.ts`)

```typescript
export const uploadPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new BadRequestError('No se recibió ningún archivo');
  const id = Number(req.params.id);
  const { role } = req.user!;
  const athlete = await athleteService.findById(id);
  // Solo ADMIN, SUPER_ADMIN o el propio atleta pueden subir
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && athlete.userId !== req.user!.userId) {
    throw new ForbiddenError('Solo puedes subir una foto para tu propio perfil');
  }
  await athleteService.uploadPhoto(id, req.file.buffer, req.file.mimetype);
  sendSuccess(res, { photoUrl: `/api/athletes/${id}/photo` });
});

export const getPhoto = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await athleteService.getPhoto(id);
  if (!result) return res.status(404).end();
  res.set('Content-Type', result.photoMimeType);
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(result.photoData);
});

export const deletePhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  await athleteService.deletePhoto(id);
  sendSuccess(res, { message: 'Foto eliminada' });
});
```

---

## Frontend — patrón de implementación

### 1. Tipo en `client.ts`

```typescript
export interface Athlete {
  // ...
  hasPhoto?: boolean;  // derivado de photoMimeType !== null, nunca viene photoData
  photoUrl?: string;   // legacy, ignorar
}

export interface Club {
  // ...
  hasLogo?: boolean;
  logoUrl?: string;    // legacy, ignorar
}
```

Métodos en `athletesApi` / `clubsApi`:

```typescript
uploadPhoto: (athleteId: number, file: File) => {
  const form = new FormData();
  form.append('photo', file);
  return api.post(`/athletes/${athleteId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
},
deletePhoto: (athleteId: number) =>
  api.delete(`/athletes/${athleteId}/photo`),
```

### 2. Componente Avatar

Solo carga la imagen si `hasPhoto === true`. Si falla (`onError`), cae a emoji de fallback:

```tsx
function AthleteAvatar({ athlete, size = 36 }: { athlete: Athlete; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = athlete.hasPhoto && !imgError;
  const src = `/api/athletes/${athlete.id}/photo`;

  const style: React.CSSProperties = {
    width: size, height: size,
    objectFit: 'cover', borderRadius: '50%',
  };

  if (!hasPhoto) {
    return <div style={{ ...style, background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>;
  }
  return <img src={src} alt={athlete.firstName} style={style} onError={() => setImgError(true)} />;
}
```

### 3. Uploader en el modal

```tsx
// Estados
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string | null>(null);
const [uploadingPhoto, setUploadingPhoto] = useState(false);
const [deletingPhoto, setDeletingPhoto] = useState(false);
const photoInputRef = useRef<HTMLInputElement>(null);

// Selección de archivo (solo client-side, sin subir aún)
const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setError('Solo JPEG, PNG o WebP');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setError('Máximo 5 MB');
    return;
  }
  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
};

// Subida (solo disponible si ya existe el atleta)
const handleUploadPhoto = async () => {
  if (!photoFile || !editingAthlete) return;
  setUploadingPhoto(true);
  try {
    await athletesApi.uploadPhoto(editingAthlete.id, photoFile);
    setPhotoFile(null);
    setPhotoPreview(`/api/athletes/${editingAthlete.id}/photo?t=${Date.now()}`);
    setEditingAthlete({ ...editingAthlete, hasPhoto: true });
    await fetchAllFromServer();
  } catch (err: any) {
    setError(formatError(err));
  } finally {
    setUploadingPhoto(false);
  }
};

// Al crear un atleta nuevo, se sube la foto inmediatamente después de crearlo
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (editingAthlete) {
    await athletesApi.update(editingAthlete.id, formData);
    if (photoFile) await athletesApi.uploadPhoto(editingAthlete.id, photoFile);
  } else {
    const res = await athletesApi.create(formData);
    const newId = (res.data as any).data?.id;
    if (photoFile && newId) await athletesApi.uploadPhoto(newId, photoFile);
  }
  // ...
};
```

JSX del uploader en el modal:

```tsx
{/* Preview 80×80 */}
<div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0', overflow: 'hidden' }}>
  {photoPreview
    ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoPreview(null)} />
    : <span style={{ fontSize: 40 }}>👤</span>
  }
</div>

{/* Botones */}
<Button variant="outline-secondary" size="sm" onClick={() => photoInputRef.current?.click()}>
  📁 Elegir imagen
</Button>
{photoFile && editingAthlete && (
  <Button variant="success" size="sm" onClick={handleUploadPhoto} disabled={uploadingPhoto}>
    {uploadingPhoto ? <Spinner size="sm" /> : '⬆️ Subir foto'}
  </Button>
)}
{(photoPreview || editingAthlete?.hasPhoto) && !photoFile && (
  <Button variant="outline-danger" size="sm" onClick={handleDeletePhoto} disabled={deletingPhoto}>
    🗑️ Eliminar foto
  </Button>
)}
{photoFile && !editingAthlete && (
  <small className="text-muted">La foto se subirá al crear el atleta</small>
)}

{/* Input oculto */}
<input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
  style={{ display: 'none' }} onChange={handlePhotoSelect} />
```

---

## Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| BYTEA en PostgreSQL en vez de Supabase Storage | Simplicidad: sin credenciales de bucket, sin URLs que expiran, sin dependencias externas. La BD ya está en Supabase. |
| `hasPhoto` booleano en vez de devolver el buffer | Las listas de atletas/clubes no deben cargar MB de bytes por cada fila. El booleano permite al frontend saber si pedir o no la imagen. |
| Cache-Control `max-age=3600` en `getPhoto` | Las fotos cambian raramente; el browser las cachea 1 hora para evitar requests innecesarios. |
| `?t=Date.now()` al actualizar preview | Fuerza al browser a descargar la imagen nueva ignorando la caché tras una subida exitosa. |
| Subida separada del submit del formulario | Para atletas ya existentes, se puede subir la foto sin tocar otros datos. Para atletas nuevos, se sube automáticamente después del `create`. |
| `multer.memoryStorage()` | El buffer queda en RAM, no se escribe a disco, y se pasa directamente a Prisma. |

---

## Errores comunes y soluciones

### `Unknown field logoMimeType for select statement on model Club`

**Causa:** Los campos `logoData`/`logoMimeType` están en `schema.prisma` pero nunca se corrió la migración, así que no existen en la BD real.

**Solución:**
```bash
cd apps/api
npx prisma migrate dev --name add_logo_data_to_club
```

### `EPERM: operation not permitted` al correr `prisma generate`

**Causa:** El servidor de desarrollo (`npm run dev`) tiene el archivo `query_engine-windows.dll.node` bloqueado.

**Solución:** Detener el servidor, correr `prisma generate`, reiniciar.

### `You can only upload a photo for your own profile` con rol SUPER_ADMIN

**Causa:** El controller solo chequeaba `role !== 'ADMIN'`, sin incluir `SUPER_ADMIN`.

**Solución:**
```typescript
if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && athlete.userId !== req.user!.userId) {
  throw new ForbiddenError(...);
}
```
