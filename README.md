# 🏹 Sistema Federativo de Historial y Medallero (MVP)

Sistema web oficial de federación para registrar competencias, resultados, y mostrar el historial de atletas y clubes nacionales.

## 📋 Características

- **CRUD completo**: Atletas, Clubes, Eventos, Categorías
- **Gestión de resultados**: Por fase (Qualification, Final, Bronze Match)
- **Medallero Nacional**: Calculado dinámicamente, auditable
- **Perfiles**: Historial deportivo de atletas y clubes
- **Atletas independientes**: Soporte completo sin afectar medallero de clubes

## 🛠️ Stack Tecnológico

### Frontend
- React + Vite
- TypeScript
- React Bootstrap
- React Router

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- JWT Authentication
- Zod Validation

### Base de Datos
- PostgreSQL (Supabase)
- Supabase Storage (imágenes)

## 📁 Estructura del Proyecto

```
medallero/
├── apps/
│   ├── api/          # Backend Express + Prisma
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── validation/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/          # Frontend React + Vite
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── api/
│           └── router/
├── packages/         # Código compartido (futuro)
└── docs/            # Documentación
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- npm 9+
- Cuenta en Supabase

### 1. Clonar y configurar

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus credenciales de Supabase
```

### 2. Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar datos iniciales (Modalidades, Fases, Admin)
npm run db:seed
```

### 3. Ejecutar en desarrollo

```bash
# Ejecutar ambos (API + Web)
npm run dev

# O ejecutar por separado:
npm run dev:api  # Backend en http://localhost:3000
npm run dev:web  # Frontend en http://localhost:5173
```

## 🔧 Variables de Entorno

### Backend (apps/api/.env)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
JWT_SECRET="tu-secreto-jwt-seguro"
JWT_EXPIRES_IN="7d"
ADMIN_SEED_EMAIL="admin@federacion.hn"
ADMIN_SEED_PASSWORD="CambiarEnProduccion!"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Clubes
- `GET /api/clubs` - Listar clubes
- `GET /api/clubs/:id` - Obtener club
- `POST /api/clubs` - Crear club (ADMIN)
- `PUT /api/clubs/:id` - Actualizar club (ADMIN)
- `DELETE /api/clubs/:id` - Eliminar club (SUPER_ADMIN)

### Atletas
- `GET /api/athletes` - Listar atletas
- `GET /api/athletes/:id` - Obtener atleta
- `POST /api/athletes` - Crear atleta (ADMIN)
- `PUT /api/athletes/:id` - Actualizar atleta (ADMIN)

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obtener evento
- `POST /api/events` - Crear evento (ADMIN)
- `PUT /api/events/:id` - Actualizar evento (ADMIN)

### Resultados
- `GET /api/events/:eventId/results` - Obtener resultados
- `POST /api/results` - Crear resultados (bulk)
- `PUT /api/results/:id` - Actualizar resultado
- `DELETE /api/results/:id` - Eliminar resultado

### Medallero
- `GET /api/medals/clubs` - Medallero Nacional de Clubes

### Perfiles
- `GET /api/profile/athlete/:id` - Perfil de atleta
- `GET /api/profile/club/:id` - Perfil de club

## 🏅 Reglas de Negocio

### Cálculo de Medallas
Las medallas NO se almacenan en la base de datos. Se derivan dinámicamente:
- **ORO**: FINAL + position 1
- **PLATA**: FINAL + position 2
- **BRONCE**: BRONZE_MATCH + position 1

### Medallero de Clubes
Solo incluye:
- Eventos con `clubMedalsEnabled = true`
- Nivel técnico: `WA_STANDARD` o `INDOOR_STANDARD`
- Excluye atletas independientes (`clubId = null`)

### Ponderación (Puntos)
- ORO: 3 puntos base
- PLATA: 2 puntos base
- BRONCE: 1 punto base
- Multiplicadores por scope y nivel técnico

## 🚀 Despliegue

### Frontend
- **Vercel** o **Netlify** (gratis)

### Backend
- **Render** o **Railway**

### Base de Datos
- **Supabase** (free tier)

## 📝 Licencia

Proyecto privado - Federación de Tiro con Arco

---

Desarrollado con ❤️ para la comunidad arquera
