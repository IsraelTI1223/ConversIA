# ConversIA - Documento de Arquitectura y Diseno de Solucion

## 1. Vision del Producto

ConversIA es una plataforma web de aprendizaje de idiomas (Ingles <-> Espanol) impulsada por IA que permite a los usuarios mantener conversaciones naturales con un asistente inteligente, practicar habilidades linguisticas y traducir textos, todo dentro de una interfaz moderna con estetica **Brutalism**.

---

## 2. Stack Tecnologico

### 2.1 Frontend
| Componente | Tecnologia | Justificacion |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG, React Server Components, routing avanzado |
| Lenguaje | **TypeScript 5.5+** | Tipado estatico, seguridad en desarrollo |
| Estilos | **Tailwind CSS 4** + CSS custom properties | Brutalism tokens, responsive utilities |
| Estado | **Zustand** | Ligero, sin boilerplate, ideal para estado de chat |
| WebSocket | **Socket.IO Client** | Comunicacion bidireccional en tiempo real |
| Audio TTS | **Web Speech API** + fallback a Azure TTS | Reproduccion de mensajes en ingles |
| Audio STT | **Web Speech API** + fallback a Azure STT | Dictado por voz ingles/espanol |
| Testing | **Vitest** + **Testing Library** + **Playwright** | Unit + Integration + E2E |

### 2.2 Backend
| Componente | Tecnologia | Justificacion |
|---|---|---|
| Framework | **NestJS 11** | Modular, inyeccion de dependencias, decoradores |
| Lenguaje | **TypeScript 5.5+** | Consistencia con frontend |
| Base de Datos | **PostgreSQL 16** | JSONB para datos flexibles, full-text search |
| ORM | **Prisma 6** | Type-safe queries, migraciones, introspection |
| Cache | **Redis 7** | Sesiones, rate limiting, cache de traducciones |
| WebSocket | **Socket.IO** (via @nestjs/websockets) | Chat en tiempo real |
| AI Provider | **Anthropic Claude API** (claude-sonnet-5) | Conversaciones, correccion, ejercicios |
| Audio TTS | **Azure Cognitive Services Speech** | Fallback server-side para TTS |
| Auth | **JWT** + **Refresh Tokens** + **bcrypt** | Autenticacion stateless, segura |
| Queue | **BullMQ** (Redis-backed) | Procesamiento asincrono de vocabulario |
| Testing | **Jest** + **Supertest** | Unit + Integration |

### 2.3 Infraestructura
| Componente | Tecnologia |
|---|---|
| Contenedores | **Docker** + **Docker Compose** |
| CI/CD | **GitHub Actions** |
| Reverse Proxy | **Nginx** o **Traefik** |
| Monitoreo | **Prometheus** + **Grafana** |
| Logs | **Winston** + **Loki** |

---

## 3. Arquitectura de Alto Nivel

```
+--------------------------------------------------+
|                   CLIENTE                         |
|  Next.js 15 (App Router)                         |
|  +--------------------------------------------+  |
|  | Pages: Dashboard | Chat | Practice | Trans |  |
|  | Components: Brutalism Design System        |  |
|  | Hooks: useChat, useAudio, useSpeech        |  |
|  | WebSocket Client (Socket.IO)               |  |
|  +--------------------------------------------+  |
+---------------------|----------------------------+
                      | HTTPS / WSS
+---------------------|----------------------------+
|              API GATEWAY (NestJS)                 |
|  +--------------------------------------------+  |
|  | Guards: Auth, RateLimit, CORS              |  |
|  | Pipes: Validation, Sanitization            |  |
|  | Interceptors: Logging, Transform           |  |
|  +--------------------------------------------+  |
+-----|---------|---------|---------|---------------+
      |         |         |         |
+-----v--+ +---v----+ +--v-----+ +-v---------+
| Auth   | | Chat   | |Practice| |Translation|
| Module | | Module | | Module | | Module    |
+--------+ +---+----+ +---+----+ +-----------+
               |           |
          +----v-----------v----+
          |   AI Service Layer  |
          |  (Anthropic Claude) |
          +----------+----------+
                     |
          +----------v----------+
          |     Data Layer      |
          | PostgreSQL | Redis  |
          +---------------------+
```

---

## 4. Modelo de Datos (Prisma Schema)

```prisma
// ==========================================
// USUARIOS Y AUTENTICACION
// ==========================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  displayName   String
  avatarUrl     String?
  cefrLevel     CefrLevel @default(A1)
  nativeLanguage String   @default("es")
  targetLanguage String   @default("en")
  totalPoints   Int      @default(0)
  streakDays    Int      @default(0)
  lastActiveAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  profile       UserProfile?
  sessions      ChatSession[]
  vocabularies  UserVocabulary[]
  practices     PracticeSession[]
  translations  TranslationLog[]
  refreshTokens RefreshToken[]

  @@index([email])
}

model UserProfile {
  id              String @id @default(cuid())
  userId          String @unique
  bio             String?
  learningGoal    String?
  dailyGoalMinutes Int   @default(15)
  preferredTopics  String[] // ["travel", "business", "daily"]
  writingScore    Int    @default(0)
  speakingScore   Int    @default(0)
  readingScore    Int    @default(0)
  listeningScore  Int    @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}

// ==========================================
// CHAT / CONVERSACIONES
// ==========================================

model ChatSession {
  id              String   @id @default(cuid())
  userId          String
  cefrLevel       CefrLevel
  topic           String           // "travel", "job_interview", etc.
  topicLabel      String           // "Viajes y Turismo"
  durationMinutes Int              // Duracion configurada
  status          SessionStatus    @default(ACTIVE)
  startedAt       DateTime         @default(now())
  endedAt         DateTime?
  audioSpeed      Float            @default(1.0) // 0.5x - 2.0x

  user     User          @relation(fields: [userId], references: [id])
  messages ChatMessage[]
  vocabulary SessionVocabulary[]

  @@index([userId, status])
}

model ChatMessage {
  id              String   @id @default(cuid())
  sessionId       String
  role            MessageRole      // USER | ASSISTANT
  contentEn       String           // Mensaje en ingles
  contentEs       String           // Mensaje en espanol
  correctionEn    String?          // Correccion del ingles (null si fue correcto)
  isCorrect       Boolean          @default(true) // Si el ingles del user fue correcto
  audioUrl        String?          // URL del audio generado
  createdAt       DateTime         @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
}

model SessionVocabulary {
  id          String @id @default(cuid())
  sessionId   String
  wordEn      String
  wordEs      String
  phonetic    String?
  exampleEn   String?
  exampleEs   String?
  category    String?  // noun, verb, adjective, phrase

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

// ==========================================
// VOCABULARIO DEL USUARIO
// ==========================================

model UserVocabulary {
  id           String   @id @default(cuid())
  userId       String
  wordEn       String
  wordEs       String
  phonetic     String?
  exampleEn    String?
  exampleEs    String?
  category     String?
  mastery      Int      @default(0) // 0-100
  practiceCount Int     @default(0)
  lastPracticedAt DateTime?
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, wordEn])
  @@index([userId, mastery])
}

// ==========================================
// PRACTICA
// ==========================================

model PracticeSession {
  id           String       @id @default(cuid())
  userId       String
  skillType    SkillType    // WRITING | SPEAKING | READING | LISTENING
  cefrLevel    CefrLevel
  totalQuestions Int
  correctAnswers Int        @default(0)
  pointsEarned Int          @default(0)
  status       SessionStatus @default(ACTIVE)
  startedAt    DateTime     @default(now())
  endedAt      DateTime?

  user      User               @relation(fields: [userId], references: [id])
  exercises PracticeExercise[]

  @@index([userId, skillType])
}

model PracticeExercise {
  id           String @id @default(cuid())
  sessionId    String
  prompt       String          // Instruccion del ejercicio
  expectedAnswer String?       // Respuesta esperada
  userAnswer   String?         // Respuesta del usuario
  isCorrect    Boolean?
  feedback     String?         // Feedback de la IA
  pointsEarned Int             @default(0)

  session PracticeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// ==========================================
// TRADUCCION
// ==========================================

model TranslationLog {
  id           String   @id @default(cuid())
  userId       String
  sourceText   String   // Texto original (max 500 palabras)
  sourceLang   String   @default("en")
  translatedText String // Texto traducido
  targetLang   String   @default("es")
  tips         String[] // Tips de mejora
  wordCount    Int
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

// ==========================================
// ENUMS
// ==========================================

enum CefrLevel {
  A1
  A2
  B1
  B2
  C1
  C2
}

enum MessageRole {
  USER
  ASSISTANT
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum SkillType {
  WRITING
  SPEAKING
  READING
  LISTENING
}
```

---

## 5. Modulos del Sistema

### 5.1 Auth Module
- **POST** `/api/auth/register` - Registro de usuario
- **POST** `/api/auth/login` - Login (JWT + Refresh Token)
- **POST** `/api/auth/refresh` - Renovar access token
- **POST** `/api/auth/logout` - Invalidar refresh token
- **GET** `/api/auth/me` - Perfil del usuario autenticado

### 5.2 User Module
- **GET** `/api/users/profile` - Obtener perfil completo
- **PATCH** `/api/users/profile` - Actualizar perfil
- **GET** `/api/users/stats` - Estadisticas y metricas
- **GET** `/api/users/vocabulary` - Vocabulario acumulado

### 5.3 Chat Module
- **POST** `/api/chat/sessions` - Crear sesion de chat
- **GET** `/api/chat/sessions` - Listar sesiones del usuario
- **GET** `/api/chat/sessions/:id` - Detalle de una sesion
- **PATCH** `/api/chat/sessions/:id/end` - Finalizar sesion
- **GET** `/api/chat/sessions/:id/vocabulary` - Vocabulario de la sesion
- **WebSocket** `chat:message` - Enviar/recibir mensajes
- **WebSocket** `chat:typing` - Indicador de escritura
- **WebSocket** `chat:audio` - Stream de audio

### 5.4 Practice Module
- **POST** `/api/practice/sessions` - Crear sesion de practica
- **POST** `/api/practice/sessions/:id/submit` - Enviar respuesta
- **GET** `/api/practice/sessions/:id/results` - Resultados
- **GET** `/api/practice/history` - Historial de practicas

### 5.5 Translation Module
- **POST** `/api/translation/translate` - Traducir texto (max 500 palabras)
- **GET** `/api/translation/history` - Historial de traducciones

---

## 6. Seguridad (OWASP Top 10)

### 6.1 A01:2021 - Broken Access Control
- JWT con expiracion corta (15 min access token)
- Refresh tokens rotados en cada uso
- Guards de NestJS en cada endpoint (`@UseGuards(JwtAuthGuard)`)
- Validacion de ownership en cada recurso (un usuario solo ve sus datos)
- RBAC preparado para futuros roles (admin, premium, free)

### 6.2 A02:2021 - Cryptographic Failures
- Passwords hasheadas con **bcrypt** (salt rounds: 12)
- HTTPS obligatorio en produccion (TLS 1.3)
- Secrets en variables de entorno, nunca en codigo
- JWT firmado con RS256 (par de llaves publica/privada)

### 6.3 A03:2021 - Injection
- Prisma ORM con queries parametrizadas (previene SQL injection)
- Input validation con **class-validator** y **class-transformer**
- Sanitizacion de HTML con **DOMPurify** en frontend
- Content Security Policy headers estrictos

### 6.4 A04:2021 - Insecure Design
- Limite de 500 palabras en traduccion (validado server-side)
- Rate limiting por usuario: 60 req/min general, 10 req/min para IA
- Timeouts en sesiones de chat (maximo 60 minutos)
- Principio de menor privilegio en cada modulo

### 6.5 A05:2021 - Security Misconfiguration
- CORS restringido a dominios permitidos
- Headers de seguridad via **helmet** (X-Frame-Options, X-Content-Type-Options, etc.)
- Docker containers sin root
- Variables de entorno validadas al inicio con **Joi/Zod**

### 6.6 A06:2021 - Vulnerable Components
- Dependabot habilitado en GitHub
- `pnpm audit` en pipeline de CI
- Lock files comprometidos (pnpm-lock.yaml)

### 6.7 A07:2021 - Auth Failures
- Brute force protection: max 5 intentos, lockout 15 min
- Refresh token rotation con deteccion de reuso
- Password policy: min 8 chars, 1 mayuscula, 1 numero, 1 especial

### 6.8 A08:2021 - Data Integrity Failures
- Validacion de DTOs en cada endpoint
- Checksums en assets estaticos
- CSP para prevenir XSS

### 6.9 A09:2021 - Logging & Monitoring
- Logging estructurado con Winston
- Audit trail de acciones criticas (login, cambio password)
- Alertas en intentos de acceso fallidos

### 6.10 A10:2021 - SSRF
- Whitelist de URLs externas permitidas (solo Anthropic API, Azure TTS)
- No se permiten URLs arbitrarias del usuario
- Validacion de URLs en inputs

---

## 7. Estructura del Proyecto

```
conversia/
+-- apps/
|   +-- web/                          # Next.js 15 Frontend
|   |   +-- src/
|   |   |   +-- app/                  # App Router pages
|   |   |   |   +-- (auth)/           # Login, Register
|   |   |   |   +-- (dashboard)/      # Dashboard principal
|   |   |   |   +-- (chat)/           # Modulo de chat
|   |   |   |   +-- (practice)/       # Modulo de practica
|   |   |   |   +-- (translate)/      # Modulo de traduccion
|   |   |   |   +-- layout.tsx
|   |   |   |   +-- page.tsx
|   |   |   +-- components/
|   |   |   |   +-- ui/               # Brutalism Design System
|   |   |   |   +-- chat/             # Componentes del chat
|   |   |   |   +-- practice/         # Componentes de practica
|   |   |   |   +-- dashboard/        # Widgets del dashboard
|   |   |   +-- hooks/
|   |   |   |   +-- use-chat.ts
|   |   |   |   +-- use-audio.ts
|   |   |   |   +-- use-speech-recognition.ts
|   |   |   |   +-- use-timer.ts
|   |   |   +-- lib/
|   |   |   |   +-- api-client.ts
|   |   |   |   +-- socket-client.ts
|   |   |   |   +-- audio-player.ts
|   |   |   +-- stores/
|   |   |   |   +-- auth-store.ts
|   |   |   |   +-- chat-store.ts
|   |   |   +-- styles/
|   |   |       +-- brutalism-tokens.css
|   |   |       +-- globals.css
|   |   +-- public/
|   |   +-- next.config.ts
|   |   +-- tailwind.config.ts
|   |
|   +-- api/                          # NestJS Backend
|       +-- src/
|       |   +-- main.ts
|       |   +-- app.module.ts
|       |   +-- common/
|       |   |   +-- guards/
|       |   |   +-- pipes/
|       |   |   +-- interceptors/
|       |   |   +-- decorators/
|       |   |   +-- filters/
|       |   +-- auth/
|       |   |   +-- auth.module.ts
|       |   |   +-- auth.controller.ts
|       |   |   +-- auth.service.ts
|       |   |   +-- strategies/
|       |   |   +-- dto/
|       |   +-- users/
|       |   |   +-- users.module.ts
|       |   |   +-- users.controller.ts
|       |   |   +-- users.service.ts
|       |   |   +-- dto/
|       |   +-- chat/
|       |   |   +-- chat.module.ts
|       |   |   +-- chat.controller.ts
|       |   |   +-- chat.service.ts
|       |   |   +-- chat.gateway.ts     # WebSocket Gateway
|       |   |   +-- dto/
|       |   +-- practice/
|       |   |   +-- practice.module.ts
|       |   |   +-- practice.controller.ts
|       |   |   +-- practice.service.ts
|       |   |   +-- dto/
|       |   +-- translation/
|       |   |   +-- translation.module.ts
|       |   |   +-- translation.controller.ts
|       |   |   +-- translation.service.ts
|       |   |   +-- dto/
|       |   +-- ai/
|       |   |   +-- ai.module.ts
|       |   |   +-- ai.service.ts       # Wrapper de Anthropic
|       |   |   +-- prompts/            # System prompts
|       |   |   +-- agents/             # Configuracion de agentes
|       |   +-- prisma/
|       |       +-- prisma.module.ts
|       |       +-- prisma.service.ts
|       |       +-- schema.prisma
|       +-- test/
|
+-- packages/
|   +-- shared-types/                  # DTOs y tipos compartidos
|   +-- ui-kit/                        # Componentes Brutalism reutilizables
|
+-- docker-compose.yml
+-- .env.example
+-- pnpm-workspace.yaml
```

---

## 8. Flujos Principales

### 8.1 Flujo de Chat

```
1. Usuario selecciona nivel CEFR + tema
2. Usuario configura duracion (5, 10, 15, 20, 30 min)
3. Se crea ChatSession en BD
4. Se conecta WebSocket con sessionId
5. IA envia mensaje inicial segun nivel y tema
6. LOOP:
   a. Usuario escribe (o dicta por voz) mensaje
   b. Frontend envia mensaje via WebSocket
   c. Backend procesa con Claude:
      - Si usuario escribio en ingles: evalua correccion
      - Genera respuesta en ingles + traduccion espanol
      - Extrae vocabulario nuevo
   d. Backend envia respuesta con:
      { contentEn, contentEs, correctionEn, isCorrect, vocabulary[] }
   e. Frontend renderiza mensaje bilingue
   f. Usuario puede reproducir audio (Web Speech API)
7. Timer llega a 0 o usuario termina sesion
8. Se muestra resumen de vocabulario capturado
9. Vocabulario se guarda en UserVocabulary
```

### 8.2 Flujo de Practica

```
1. Usuario entra a modulo Practice
2. Selecciona skill: Writing | Speaking | Reading | Listening
3. IA genera ejercicios basados en UserVocabulary
4. Usuario completa ejercicios
5. IA evalua respuestas y da feedback
6. Puntos se suman al perfil del usuario
7. Mastery del vocabulario se actualiza
```

### 8.3 Flujo de Traduccion

```
1. Usuario pega texto en ingles (max 500 palabras)
2. Validacion client-side del word count
3. Backend valida y envia a Claude
4. Claude traduce + genera tips de mejora
5. Se muestra traduccion + tips
6. Se guarda en TranslationLog
```
