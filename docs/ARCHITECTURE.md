# ConversIA - Documento de Arquitectura

**Version:** 1.0  
**Fecha:** 2026-09-11  
**Autor:** Israel Ramos

---

## 1. Vision General

ConversIA es una plataforma de aprendizaje de ingles potenciada por IA que permite a hispanohablantes practicar conversacion, writing, reading y listening con correccion en tiempo real. La arquitectura sigue un patron **monorepo** con separacion frontend/backend y comunicacion via REST API + WebSockets.

```
ConversIA/
├── apps/
│   ├── api/          # NestJS 11 - Backend API
│   └── web/          # Next.js 15 - Frontend SPA
├── docker/           # Docker Compose para infraestructura
├── docs/             # Documentacion tecnica
├── package.json      # Root workspace (pnpm)
└── pnpm-workspace.yaml
```

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Version | Proposito |
|------|-----------|---------|-----------|
| Frontend | Next.js (App Router) | 15 | SSR/SPA, routing, rendering |
| Frontend | React | 19 | UI components |
| Frontend | TypeScript | 5.5+ | Type safety |
| Frontend | Tailwind CSS | 4 | Utility-first styling |
| Frontend | Zustand | 5 | Client-side state management |
| Frontend | Socket.IO Client | 4.8 | Real-time WebSocket |
| Backend | NestJS | 11 | API framework (DI, modules) |
| Backend | TypeScript | 5.5+ | Type safety |
| Backend | Prisma | 6 | ORM / Database access |
| Backend | Passport + JWT | 11/4 | Authentication |
| Backend | Socket.IO | 4.8 | WebSocket server |
| Backend | Helmet | 8 | HTTP security headers |
| Backend | class-validator | 0.14 | DTO validation |
| Database | PostgreSQL | 16 | Relational data store |
| Cache | Redis | 7 | Session cache, rate limiting |
| AI | Anthropic Claude SDK | 0.50 | Primary AI provider |
| AI | Google Generative AI | 0.21 | Secondary AI provider (Gemini) |
| DevOps | Docker Compose | 3.9 | Local infrastructure |
| DevOps | pnpm workspaces | 11 | Monorepo package manager |

---

## 3. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS 4   │
│  ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐       │
│  │ Landing  │ │  Auth  │ │ Dashboard│ │  Chat    │      │
│  │ /        │ │ /login │ │ /dashboard│ /chat    │      │
│  │          │ │/register│ │         │ │(WebSocket)│     │
│  └──────────┘ └────────┘ └────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐                              │
│  │ Practice │ │ Translate│   Zustand (State)             │
│  │ /practice│ │/translate│   ApiClient (HTTP)            │
│  └──────────┘ └──────────┘   Socket.IO Client            │
└────────────┬──────────────────┬──────────────────────────┘
             │ REST (HTTPS)     │ WebSocket (WSS)
             ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                          │
│              NestJS 11 + TypeScript                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Middleware Layer                     │    │
│  │  Helmet │ CORS │ ValidationPipe │ ThrottlerGuard │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌─────────┐    │
│  │ Auth │ │Users │ │ Chat │ │Practice│ │Translat.│    │
│  │Module│ │Module│ │Module│ │ Module │ │ Module  │    │
│  └──┬───┘ └──┬───┘ └──┬───┘ └───┬────┘ └────┬────┘    │
│     │        │        │         │            │          │
│  ┌──┴────────┴────────┴─────────┴────────────┴──┐      │
│  │              AI Module (AiService)            │      │
│  │   AnthropicProvider  │  GeminiProvider        │      │
│  │   (claude-sonnet-5)  │  (gemini-2.0-flash)    │      │
│  └──────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────┐      │
│  │          Prisma Module (PrismaService)        │      │
│  └──────────────────────────────────────────────┘      │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│  16      │  │    7     │
│:5433     │  │  :6380   │
└──────────┘  └──────────┘
```

---

## 4. Componentes del Backend (API)

### 4.1 AppModule (`app.module.ts`)
Modulo raiz que orquesta la inyeccion de dependencias. Configura:
- **ConfigModule**: Variables de entorno globales
- **ThrottlerModule**: Rate limiting con 2 perfiles (general: 60 req/min, ai: 10 req/min)
- Importa todos los modulos funcionales

### 4.2 AuthModule (`auth/`)
Responsable de la autenticacion y autorizacion de usuarios.

| Componente | Archivo | Funcion |
|------------|---------|---------|
| AuthController | `auth.controller.ts` | Endpoints POST `/auth/register`, `/auth/login`, `/auth/refresh` |
| AuthService | `auth.service.ts` | Logica de registro (bcrypt hash salt 12), login (comparacion), refresh token rotation |
| JwtStrategy | `strategies/jwt.strategy.ts` | Passport strategy: extrae Bearer token, valida usuario activo |
| RegisterDto | `dto/register.dto.ts` | Validacion: email, password (8-64 chars), firstName, lastName, cefrLevel opcional |
| LoginDto | `dto/login.dto.ts` | Validacion: email + password |
| RefreshTokenDto | `dto/refresh-token.dto.ts` | Validacion: refreshToken string |

**Flujo de autenticacion:**
1. `POST /auth/register` -> Crea usuario + perfil, genera par de tokens JWT
2. `POST /auth/login` -> Valida credenciales, genera par de tokens JWT
3. `POST /auth/refresh` -> Elimina token viejo, genera nuevo par (rotation)
4. Access token: expira en 15min, refresh token: expira en 7 dias

### 4.3 UsersModule (`users/`)
Gestion de perfiles de usuario.

| Endpoint | Metodo | Guard | Funcion |
|----------|--------|-------|---------|
| `/users/profile` | GET | JWT | Retorna perfil del usuario autenticado (sin passwordHash) |
| `/users/stats` | GET | JWT | Retorna estadisticas: nivel, puntos, racha, vocabulario, skills |
| `/users/profile` | PATCH | JWT | Actualiza cefrLevel del perfil |

### 4.4 ChatModule (`chat/`)
Modulo de conversacion en tiempo real con IA.

| Componente | Funcion |
|------------|---------|
| ChatController | REST endpoints para crear/listar/terminar sesiones |
| ChatService | CRUD de sesiones, mensajes y vocabulario |
| ChatGateway | WebSocket gateway en namespace `/chat` |

**Flujo de conversacion:**
1. Usuario crea sesion via REST (nivel CEFR + tema + duracion)
2. Se conecta al WebSocket y emite `join_session`
3. Envia mensaje con `send_message` -> Gateway recibe
4. Gateway llama a AiService.processMessage() con historial (ultimos 10 mensajes)
5. AI responde con contentEn/contentEs/correccion/vocabulario
6. Se persiste el mensaje y vocabulario nuevo
7. Respuesta se emite al cliente como `new_message`

### 4.5 PracticeModule (`practice/`)
Modulo de ejercicios de practica personalizados.

| Endpoint | Metodo | Guard | Funcion |
|----------|--------|-------|---------|
| `/practice/sessions` | POST | JWT | Crea sesion de practica: busca vocabulario debil (mastery < 80%), genera ejercicio con AI |
| `/practice/exercises/:id/submit` | POST | JWT | Evalua respuesta del usuario con AI, actualiza puntos y scores |

**Logica de practica:**
1. Selecciona 5 palabras con menor maestria del usuario
2. Genera ejercicio adaptado al skillType y cefrLevel
3. Evalua respuesta (temperatura 0.3 para consistencia)
4. Actualiza totalPoints y el score de la habilidad especifica

### 4.6 TranslationModule (`translation/`)
Modulo de traduccion con analisis gramatical.

| Endpoint | Metodo | Guard | Funcion |
|----------|--------|-------|---------|
| `/translation` | POST | JWT | Recibe texto en ingles (max 500 palabras), traduce y analiza |

**Flujo:**
1. Valida limite de 500 palabras (server-side)
2. Obtiene nivel CEFR del perfil del usuario
3. Llama a AiService.translateText() con prompt especializado
4. Persiste resultado en TranslationLog
5. Retorna traduccion + score + tips de mejora

### 4.7 AiModule (`ai/`)
Modulo central de orquestacion de IA con patron Strategy.

| Componente | Funcion |
|------------|---------|
| AiService | Orquestador: processMessage, generateExercise, evaluateExercise, translateText |
| AiProvider (interface) | Contrato: `chat(system, messages, options) -> string` |
| AnthropicProvider | Implementacion con Anthropic Claude SDK |
| GeminiProvider | Implementacion con Google Generative AI SDK |
| AiProviderFactory | Factory que instancia el provider segun `AI_PROVIDER` env var |

**Configuracion por funcion:**

| Funcion | Temperatura | Max Tokens | Proposito |
|---------|-------------|------------|-----------|
| processMessage | 0.8 | 1024 | Conversacion natural y variada |
| generateExercise | 0.6 | 1024 | Creatividad controlada en ejercicios |
| evaluateExercise | 0.3 | 512 | Evaluacion consistente y precisa |
| translateText | 0.3 | 2048 | Traduccion fiel y analisis |

**System Prompts especializados:**
- `chat.prompt.ts`: Prompt dinamico por nivel CEFR con guias de complejidad
- `practice.prompt.ts`: Prompt por tipo de habilidad (Writing/Speaking/Reading/Listening)
- `translation.prompt.ts`: Prompt de traduccion con formato JSON obligatorio

### 4.8 PrismaModule (`prisma/`)
Capa de acceso a datos singleton.

| Componente | Funcion |
|------------|---------|
| PrismaService | Extiende PrismaClient, maneja onModuleInit/onModuleDestroy |
| PrismaModule | Global module, exporta PrismaService |

### 4.9 Common (`common/`)
Componentes transversales.

| Componente | Funcion |
|------------|---------|
| HttpExceptionFilter | Captura todas las excepciones, normaliza respuesta JSON |
| JwtAuthGuard | Guard reutilizable que aplica Passport JWT strategy |

---

## 5. Componentes del Frontend (Web)

### 5.1 Layout y Routing

```
app/
├── layout.tsx          # Root layout: Google Fonts, global CSS
├── page.tsx            # Landing page (publica)
├── globals.css         # Design system Neo-Brutalism
├── (auth)/
│   ├── login/page.tsx  # Login form -> /login
│   └── register/page.tsx # Register form -> /register
└── (app)/
    ├── dashboard/page.tsx # Dashboard -> /dashboard
    ├── chat/page.tsx      # Chat config + session -> /chat
    ├── practice/page.tsx  # Skill selection -> /practice
    └── translate/page.tsx # Translation tool -> /translate
```

- **Route Groups**: `(auth)` y `(app)` organizan sin afectar URL
- **Design System**: Neo-Brutalism con bordes gruesos, sombras offset, colores saturados

### 5.2 Stores (Estado Global)

| Store | Archivo | Responsabilidad |
|-------|---------|-----------------|
| AuthStore | `stores/auth.store.ts` | Login, register, logout, usuario actual, token management |
| ChatStore | `stores/chat.store.ts` | Conexion Socket.IO, join/send messages, typing indicators |

### 5.3 Libreria de Red

| Componente | Archivo | Funcion |
|------------|---------|---------|
| ApiClient | `lib/api.ts` | Cliente HTTP tipado con Bearer auth, metodos get/post/patch |

### 5.4 Componentes UI Compartidos

| Componente | Archivo | Funcion |
|------------|---------|---------|
| AppNav | `components/ui/AppNav.tsx` | Barra de navegacion: logo + links con estado activo |

### 5.5 Design System (globals.css)

**Tokens de color:**
| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| --color-primary | #FF6B35 | (mismo) | CTAs, acentos principales |
| --color-secondary | #004E89 | (mismo) | Elementos secundarios |
| --color-turquesa | #2EC4B6 | (mismo) | Speaking, highlights |
| --color-yellow | #FCBF49 | (mismo) | Puntos, badges |
| --color-lime | #B8F83E | (mismo) | Exito, scores altos |
| --color-red | #E71D36 | (mismo) | Errores, scores bajos |

**Componentes CSS:**
- `.brutal-card`: Tarjeta con borde grueso, sombra offset, hover translate(-2px)
- `.brutal-btn`: Boton uppercase, tracking wide, estados hover/active con translate
- `.brutal-input`: Input monospace, focus cambia shadow y border-color
- `.brutal-badge`: Badge monospace con borde
- `.brutal-heading`: Space Grotesk bold, tracking tight, line-height 1.1
- `.brutal-label`: Uppercase, letter-spacing wide, color secundario
- `.marquee-strip`: Cinta animada con scroll infinito

---

## 6. Modelo de Datos

### Diagrama Entidad-Relacion

```
User (1) ──── (1) UserProfile
  │
  ├── (1:N) RefreshToken
  ├── (1:N) ChatSession ──── (1:N) ChatMessage
  │                     └── (1:N) SessionVocabulary
  ├── (1:N) UserVocabulary
  ├── (1:N) PracticeSession ──── (1:N) PracticeExercise
  └── (1:N) TranslationLog
```

### Tablas y Proposito

| Modelo | Tabla | Records Esperados | Funcion |
|--------|-------|-------------------|---------|
| User | users | Miles | Cuenta de usuario con email/password |
| UserProfile | user_profiles | 1 por usuario | Nivel CEFR, puntos, racha, scores por habilidad |
| RefreshToken | refresh_tokens | N por usuario | Tokens de refresh con expiracion |
| ChatSession | chat_sessions | Decenas por usuario | Sesion de chat: tema, nivel, duracion, status |
| ChatMessage | chat_messages | Cientos por sesion | Mensajes en ingles/espanol con correcciones |
| SessionVocabulary | session_vocabulary | Decenas por sesion | Vocabulario detectado en una sesion |
| UserVocabulary | user_vocabulary | Cientos por usuario | Vocabulario acumulado con mastery score |
| PracticeSession | practice_sessions | Decenas por usuario | Sesion de practica por habilidad |
| PracticeExercise | practice_exercises | N por sesion | Ejercicio generado con score y feedback |
| TranslationLog | translation_logs | N por usuario | Historial de traducciones con analisis |

### Indices de Rendimiento
- `users.email` (unique)
- `refresh_tokens.token` (unique) + `userId` index
- `chat_sessions.[userId, status]` (compound)
- `chat_messages.sessionId`
- `user_vocabulary.[userId, wordEn]` (unique) + `[userId, mastery]` index
- `practice_sessions.[userId, skillType]` (compound)
- `translation_logs.userId`

---

## 7. Flujos de Datos Principales

### 7.1 Registro y Login
```
Cliente -> POST /auth/register -> AuthController -> AuthService
  -> bcrypt.hash(password, 12)
  -> prisma.user.create + prisma.userProfile.create
  -> jwtService.sign(accessToken) + jwtService.sign(refreshToken)
  -> prisma.refreshToken.create
  <- { user (sin hash), accessToken, refreshToken }
```

### 7.2 Conversacion AI en Tiempo Real
```
Cliente -> Socket.IO connect(/chat)
  -> emit('join_session', {sessionId})
  -> emit('send_message', {sessionId, userId, content, language})
    -> ChatGateway -> ChatService.getSession() [auth check]
    -> ChatService.saveMessage(USER)
    -> AiService.processMessage() -> AnthropicProvider/GeminiProvider
    -> ChatService.saveMessage(ASSISTANT)
    -> ChatService.saveVocabulary()
    <- emit('new_message', aiResponse)
```

### 7.3 Practica Adaptativa
```
Cliente -> POST /practice/sessions {skillType, cefrLevel}
  -> PracticeController [JwtAuthGuard]
  -> PracticeService.createSession()
    -> prisma.userVocabulary.findMany(mastery < 80, take 5)
    -> AiService.generateExercise(vocab, skill, level)
    -> prisma.practiceExercise.create
  <- { session, exercise }

Cliente -> POST /practice/exercises/:id/submit {answer}
  -> PracticeService.submitAnswer()
    -> AiService.evaluateExercise(exercise, answer)
    -> prisma.practiceExercise.update(score, feedback)
    -> prisma.userProfile.update(points, skillScore)
  <- { score, feedbackEn, feedbackEs }
```

---

## 8. Decisiones Arquitectonicas

| Decision | Razon |
|----------|-------|
| Monorepo con pnpm workspaces | Comparte tipos, facilita desarrollo local, CI unificado |
| NestJS sobre Express puro | DI nativa, modularidad, decorators, guards, pipes |
| Prisma sobre TypeORM | Type-safe queries, migraciones declarativas, schema como fuente de verdad |
| Zustand sobre Redux | API minimal, sin boilerplate, ideal para app de tamano medio |
| Strategy pattern para AI providers | Facilita cambiar entre Anthropic y Gemini sin tocar logica de negocio |
| Next.js App Router | Route groups, server components futuros, layouts anidados |
| WebSocket para chat | Baja latencia, typing indicators, UX de chat nativo |
| PostgreSQL sobre MongoDB | Relaciones fuertes entre entidades, transacciones ACID |
| Neo-Brutalism CSS | Identidad visual diferenciada, accesible, memorable |
