# Deploy ConversIA - Guía de Producción (Piloto Gratuito)

## Arquitectura

```
[Vercel]         [Render]         [Neon]        [Upstash]
 Next.js  <--->  NestJS API  <-->  PostgreSQL    Redis
 Frontend        Backend          Database       Cache
```

## 1. Base de Datos — Neon (PostgreSQL)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear proyecto "conversia"
3. Copiar las dos URLs que proporciona:
   - `DATABASE_URL` (con pooler/pgbouncer)
   - `DIRECT_URL` (conexión directa)

## 2. Redis — Upstash

1. Crear cuenta en [upstash.com](https://upstash.com)
2. Crear una base de datos Redis en la región más cercana
3. Copiar los valores:
   - `REDIS_HOST` (ej: us1-xxx.upstash.io)
   - `REDIS_PORT` (ej: 6379)
   - `REDIS_PASSWORD`

## 3. Backend — Render

### Opción A: Blueprint (recomendado)

1. Subir el repo a GitHub
2. Ir a [render.com](https://render.com) → New → Blueprint
3. Conectar el repo — Render detecta `render.yaml` automáticamente
4. Completar las variables marcadas como `sync: false`:
   - `DATABASE_URL` y `DIRECT_URL` (de Neon)
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (de Upstash)
   - `GEMINI_API_KEY` (tu API key de Google)
   - `CORS_ORIGIN` (la URL de Vercel, ej: https://conversia.vercel.app)

### Opción B: Manual

1. New → Web Service → Docker
2. Root Directory: (dejar vacío, usa la raíz del repo)
3. Dockerfile Path: `apps/api/Dockerfile`
4. Docker Context: `.`
5. Configurar las mismas variables de entorno

**URL del backend**: Render te dará algo como `https://conversia-api.onrender.com`

## 4. Frontend — Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repo de GitHub
3. Configuración:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
4. Variables de entorno:
   - `NEXT_PUBLIC_API_URL` = `https://conversia-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_WS_URL` = `wss://conversia-api.onrender.com`
5. Deploy

## Variables de Entorno - Resumen

### Render (Backend)

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | URL de Neon (pooler) |
| `DIRECT_URL` | URL de Neon (directa) |
| `REDIS_HOST` | Host de Upstash |
| `REDIS_PORT` | Puerto de Upstash |
| `REDIS_PASSWORD` | Password de Upstash |
| `JWT_SECRET` | (auto-generado por Render) |
| `JWT_REFRESH_SECRET` | (auto-generado por Render) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Tu API key |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `CORS_ORIGIN` | URL de Vercel |

### Vercel (Frontend)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<tu-render>.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://<tu-render>.onrender.com` |

## Notas del Free Tier

- **Render Free**: el servicio se apaga tras 15 min de inactividad. El primer request tarda ~30s en despertar (cold start).
- **Neon Free**: 0.5GB storage, compute se suspende tras 5 min de inactividad (reconecta automáticamente).
- **Upstash Free**: 10,000 comandos/día, suficiente para piloto.
- **Vercel Free**: 100GB bandwidth/mes, builds ilimitados.
- **Gemini Free**: tier gratuito generoso para desarrollo.
