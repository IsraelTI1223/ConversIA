# ConversIA - Guia de Despliegue Local y Productivo

**Version:** 1.0  
**Fecha:** 2026-09-11

---

## Parte 1: Despliegue Local (Desarrollo)

### Prerequisitos

| Software | Version | Verificacion |
|----------|---------|-------------|
| Node.js | 20+ LTS | `node --version` |
| pnpm | 11+ | `pnpm --version` |
| Docker Desktop | 4.x | `docker --version` |
| Git | 2.x | `git --version` |

### Paso 1: Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/IsraelTI1223/ConversIA.git
cd ConversIA

# Instalar dependencias
pnpm install
```

### Paso 2: Variables de Entorno

Crear `apps/api/.env` basandose en `apps/api/.env.example`:

```bash
cp apps/api/.env.example apps/api/.env
```

Valores minimos a configurar:

```env
# Obligatorios
DATABASE_URL="postgresql://conversia:conversia_dev@localhost:5433/conversia_db?schema=public"
JWT_SECRET=<generar con: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generar con: openssl rand -base64 64>

# AI Provider - elegir uno
AI_PROVIDER=gemini
GEMINI_API_KEY=<tu-api-key-de-google>
# O bien:
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=<tu-api-key-de-anthropic>
```

Crear `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Paso 3: Levantar Infraestructura con Docker

```bash
# Iniciar PostgreSQL 16 y Redis 7
cd docker
docker compose up -d conversia-db conversia-redis

# Verificar que estan corriendo
docker compose ps
# Esperar a que ambos pasen healthcheck (~15 segundos)
docker compose logs -f conversia-db  # Ctrl+C cuando veas "ready to accept connections"
```

**Puertos asignados:**
- PostgreSQL: `localhost:5433` (no usa el 5432 default para evitar conflictos)
- Redis: `localhost:6380` (no usa el 6379 default)

### Paso 4: Configurar Base de Datos

```bash
cd ..  # Volver a raiz del proyecto

# Generar Prisma Client
pnpm --filter conversia-api run prisma:generate

# Ejecutar migraciones (crea tablas)
pnpm --filter conversia-api run prisma:migrate

# (Opcional) Cargar datos de prueba
pnpm --filter conversia-api run prisma:seed
```

### Paso 5: Iniciar Servicios

**Terminal 1 - Backend API:**
```bash
pnpm run dev:api
# > NestJS starting on http://localhost:4000
# > API prefix: /api/v1
```

**Terminal 2 - Frontend Web:**
```bash
pnpm run dev:web
# > Next.js ready on http://localhost:3000
```

### Paso 6: Verificar

| Servicio | URL | Esperado |
|----------|-----|----------|
| Frontend | http://localhost:3000 | Landing page ConversIA |
| API Health | http://localhost:4000/api/v1 | Respuesta del servidor |
| Login | http://localhost:3000/login | Formulario de login |
| Dashboard | http://localhost:3000/dashboard | Dashboard (requiere auth) |

### Comandos Utiles en Desarrollo

```bash
# Ver logs de Docker
docker compose -f docker/docker-compose.yml logs -f

# Acceder a PostgreSQL directamente
docker exec -it conversia-db psql -U conversia -d conversia_db

# Acceder a Redis CLI
docker exec -it conversia-redis redis-cli

# Abrir Prisma Studio (GUI para DB)
cd apps/api && npx prisma studio

# Ejecutar tests del API
pnpm --filter conversia-api test

# Ejecutar tests del Web
pnpm --filter conversia-web test

# Limpiar y reinstalar
pnpm --filter conversia-api run prisma:migrate -- --reset  # CUIDADO: borra datos
```

### Troubleshooting Local

| Problema | Solucion |
|----------|---------|
| Puerto 5433 ocupado | `docker ps` para ver contenedores, `docker stop <id>` |
| Puerto 3000 ocupado | Cambiar en `apps/web/package.json` script dev: `next dev --port 3001` |
| Error ECONNREFUSED en API | Verificar que Docker esta corriendo: `docker compose ps` |
| Prisma migration error | Verificar DATABASE_URL en .env, que PostgreSQL este healthy |
| .next cache corrupto | `rm -rf apps/web/.next` y reiniciar |
| node_modules problemas | `pnpm install --force` |

---

## Parte 2: Despliegue Productivo

### Arquitectura de Produccion Recomendada

```
                    ┌─────────────┐
                    │  Cloudflare  │
                    │   DNS + CDN  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Nginx     │
                    │ Reverse     │
                    │ Proxy + TLS │
                    └──┬──────┬──┘
                       │      │
              ┌────────┘      └────────┐
              ▼                        ▼
       ┌─────────────┐         ┌─────────────┐
       │  Next.js     │         │  NestJS     │
       │  (Frontend)  │         │   (API)     │
       │  Port 3000   │         │  Port 4000  │
       └─────────────┘         └──┬──────┬──┘
                                  │      │
                          ┌───────┘      └───────┐
                          ▼                      ▼
                   ┌─────────────┐        ┌─────────────┐
                   │ PostgreSQL  │        │    Redis     │
                   │  Managed    │        │   Managed    │
                   └─────────────┘        └─────────────┘
```

### Opcion A: VPS (DigitalOcean / Hetzner / AWS EC2)

#### A.1 Preparar Servidor

```bash
# Ubuntu 22.04 LTS recomendado
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### A.2 Configurar Nginx

```nginx
# /etc/nginx/sites-available/conversia
server {
    listen 80;
    server_name conversia.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name conversia.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/conversia.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/conversia.tudominio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /chat {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

```bash
# Activar sitio y obtener certificado SSL
sudo ln -s /etc/nginx/sites-available/conversia /etc/nginx/sites-enabled/
sudo certbot --nginx -d conversia.tudominio.com
sudo nginx -t && sudo systemctl reload nginx
```

#### A.3 Desplegar Aplicacion

```bash
# Clonar repositorio
cd /opt
git clone https://github.com/IsraelTI1223/ConversIA.git
cd ConversIA

# Instalar dependencias de produccion
pnpm install --prod

# Configurar .env de produccion
cp apps/api/.env.example apps/api/.env
# Editar con valores de produccion (ver seccion "Variables de Produccion")

# Levantar DB y Redis
cd docker
docker compose up -d conversia-db conversia-redis
cd ..

# Ejecutar migraciones
pnpm --filter conversia-api run prisma:generate
pnpm --filter conversia-api run prisma:migrate -- deploy

# Build de produccion
pnpm --filter conversia-api run build
pnpm --filter conversia-web run build
```

#### A.4 Process Manager (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Configurar ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'conversia-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'conversia-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
EOF

# Iniciar servicios
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configura auto-start al reiniciar servidor
```

### Opcion B: Docker Compose Completo

```bash
# Usar el docker-compose.yml existente que incluye todos los servicios
cd docker
docker compose up -d

# Verificar
docker compose ps
docker compose logs -f
```

### Opcion C: Plataformas Cloud (PaaS)

| Componente | Plataforma Recomendada | Costo Estimado |
|------------|----------------------|----------------|
| Frontend | Vercel (Next.js nativo) | Free tier |
| API | Railway / Render / Fly.io | ~$7/mes |
| PostgreSQL | Supabase / Neon / Railway | Free tier |
| Redis | Upstash | Free tier |

**Configuracion Vercel (Frontend):**
```bash
# Instalar CLI
npm i -g vercel

# Desplegar desde la raiz
cd apps/web
vercel --prod

# Variables de entorno en Vercel Dashboard:
# NEXT_PUBLIC_API_URL=https://api.conversia.tudominio.com/api/v1
# NEXT_PUBLIC_WS_URL=wss://api.conversia.tudominio.com
```

**Configuracion Railway (API):**
```bash
# railway.toml en apps/api/
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "npx prisma migrate deploy && node dist/main.js"
```

---

## Variables de Entorno para Produccion

```env
# ============ CAMBIAR OBLIGATORIAMENTE ============
NODE_ENV=production
PORT=4000

# Database - usar managed PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/conversia_prod?schema=public&sslmode=require"

# Secrets - generar con: openssl rand -base64 64
JWT_SECRET=<RANDOM_64_BYTES_BASE64>
JWT_REFRESH_SECRET=<DIFFERENT_RANDOM_64_BYTES_BASE64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=<PRODUCTION_API_KEY>

# Redis
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# CORS - dominio de produccion
CORS_ORIGIN=https://conversia.tudominio.com

# Rate Limiting (mas restrictivo en prod)
RATE_LIMIT_GENERAL=30
RATE_LIMIT_AI=5
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=warn
```

---

## Checklist de Produccion

### Seguridad
- [ ] Generar JWT_SECRET y JWT_REFRESH_SECRET unicos (64+ bytes)
- [ ] Rotar API keys de AI (no usar las de desarrollo)
- [ ] Configurar CORS_ORIGIN con dominio exacto
- [ ] Habilitar SSL/TLS (HTTPS obligatorio)
- [ ] Configurar Helmet con CSP personalizada
- [ ] Implementar autenticacion en WebSocket gateway
- [ ] Configurar firewall (solo puertos 80, 443 abiertos)
- [ ] Desactivar debug logging en produccion

### Base de Datos
- [ ] Usar PostgreSQL managed (backups automaticos)
- [ ] Habilitar SSL en conexion a DB (`sslmode=require`)
- [ ] Crear usuario de DB con permisos minimos
- [ ] Configurar backups automaticos (diarios)
- [ ] Ejecutar `prisma migrate deploy` (no `dev`)

### Monitoreo
- [ ] Configurar health check endpoint
- [ ] Implementar logging estructurado (JSON)
- [ ] Configurar alertas de error rate
- [ ] Monitorear uso de tokens AI (costos)
- [ ] Configurar uptime monitoring (UptimeRobot, Better Uptime)

### Performance
- [ ] Habilitar compression en Nginx (gzip)
- [ ] Configurar cache headers para assets estaticos
- [ ] Usar connection pooling en PostgreSQL (PgBouncer)
- [ ] Configurar Redis para cache de sesiones
- [ ] Next.js: habilitar ISR donde aplique

### CI/CD (Recomendado)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm --filter conversia-api test
      - run: pnpm --filter conversia-web build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: ssh deploy@server "cd /opt/ConversIA && git pull && pnpm install && pnpm build && pm2 restart all"
```
