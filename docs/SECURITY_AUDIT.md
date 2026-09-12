# ConversIA - Security Audit Report

**Fecha:** 2026-09-11  
**Auditor:** Israel Ramos / Claude AI  
**Alcance:** Full-stack analysis (NestJS API + Next.js Frontend)  
**Estándares:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), CWE/SANS Top 25

---

## Resumen Ejecutivo

| Severidad | Hallazgos |
|-----------|-----------|
| CRITICA   | 2         |
| ALTA      | 4         |
| MEDIA     | 5         |
| BAJA      | 3         |

---

## HALLAZGOS CRITICOS

### C-01: API Key Expuesta en Repositorio
**OWASP:** A07:2021 - Security Misconfiguration  
**Archivo:** `apps/api/.env` linea 33  
**Descripcion:** La API key de Google Gemini esta hardcodeada en el archivo `.env` con un valor real (`AQ.Ab8RN6J_XFnxXPwtNyRKwv51E_...`). Aunque `.env` esta en `.gitignore`, si el archivo fue commiteado previamente, la clave queda expuesta en el historial de Git.

**Impacto:** Acceso no autorizado al servicio de Gemini, consumo de creditos, posible uso malicioso.

**Remediacion:**
1. Rotar inmediatamente la API key de Gemini en Google Cloud Console
2. Verificar con `git log --all --full-history -- apps/api/.env` que el archivo nunca fue commiteado
3. Usar un secret manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) en produccion
4. Implementar deteccion de secrets en pre-commit hooks (gitleaks, trufflehog)

### C-02: WebSocket Gateway sin Autenticacion
**OWASP API:** API2:2023 - Broken Authentication  
**Archivo:** `apps/api/src/chat/chat.gateway.ts` lineas 14, 24-26  
**Descripcion:** El WebSocket gateway tiene `cors: { origin: '*' }` y el metodo `handleConnection()` no valida JWT. Cualquier cliente puede conectarse, unirse a sesiones y enviar mensajes.

```typescript
// VULNERABLE - Sin autenticacion
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
handleConnection(client: Socket) {
  // JWT validation would go here via middleware
}
```

**Impacto:** Un atacante puede:
- Enviar mensajes como cualquier usuario (spoofing `userId`)
- Consumir tokens de AI sin autenticacion
- Acceder a sesiones de chat de otros usuarios

**Remediacion:**
```typescript
handleConnection(client: Socket) {
  const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
  if (!token) { client.disconnect(); return; }
  try {
    const payload = this.jwtService.verify(token);
    client.data.userId = payload.sub;
  } catch {
    client.disconnect();
  }
}
```

---

## HALLAZGOS DE SEVERIDAD ALTA

### A-01: Inyeccion de Prompt (Prompt Injection)
**OWASP LLM:** LLM01 - Prompt Injection  
**Archivo:** `apps/api/src/ai/ai.service.ts` lineas 42-59  
**Descripcion:** El contenido del usuario se pasa directamente al LLM sin sanitizacion. Un usuario puede inyectar instrucciones maliciosas en su mensaje para manipular el system prompt.

```typescript
messages.push({ role: 'user', content: params.userMessage }); // Sin sanitizar
```

**Impacto:** Exfiltracion del system prompt, bypass de limites CEFR, generacion de contenido no deseado.

**Remediacion:**
1. Implementar un filtro de prompt injection que detecte patrones como "ignore previous instructions", "system:", etc.
2. Validar longitud maxima del mensaje del usuario (ej. 2000 chars)
3. Usar structured outputs donde sea posible
4. Implementar output validation para las respuestas JSON del LLM

### A-02: JSON.parse sin Validacion en Respuestas AI
**CWE-20:** Improper Input Validation  
**Archivo:** `apps/api/src/ai/ai.service.ts` lineas 59, 83, 112, 131  
**Descripcion:** Las respuestas del LLM se parsean con `JSON.parse(response)` sin try/catch ni validacion de schema. Si el LLM devuelve JSON malformado, la aplicacion lanza una excepcion no controlada.

**Impacto:** Denial of Service, respuestas inesperadas al usuario, crash del servidor.

**Remediacion:**
```typescript
private parseAiResponse<T>(response: string, context: string): T {
  try {
    const parsed = JSON.parse(response);
    // Validar schema con class-validator o zod
    return parsed;
  } catch (error) {
    this.logger.error(`Invalid AI response [${context}]: ${response.substring(0, 200)}`);
    throw new InternalServerErrorException('AI response parsing failed');
  }
}
```

### A-03: Refresh Token sin Hashing
**OWASP:** A02:2021 - Cryptographic Failures  
**Archivo:** `apps/api/src/auth/auth.service.ts` lineas 77-91  
**Descripcion:** Los refresh tokens se almacenan en texto plano en la base de datos. Si la DB es comprometida, un atacante puede usar los tokens directamente para generar access tokens.

**Impacto:** Session hijacking si la base de datos es comprometida.

**Remediacion:**
1. Hashear el refresh token con SHA-256 antes de almacenarlo
2. Comparar el hash al validar
3. Implementar familia de tokens (token family) para detectar reuso

### A-04: userId Controlado por el Cliente en WebSocket
**OWASP API:** API1:2023 - Broken Object Level Authorization (BOLA)  
**Archivo:** `apps/api/src/chat/chat.gateway.ts` lineas 44-49  
**Descripcion:** El `userId` se recibe del cliente en el payload del mensaje WebSocket, no se extrae del JWT autenticado. Un usuario puede suplantar a otro usuario.

```typescript
data: { sessionId: string; userId: string; content: string; } // userId del cliente
```

**Impacto:** Un atacante puede operar como cualquier usuario del sistema.

**Remediacion:** Extraer `userId` del JWT validado en la conexion (`client.data.userId`), nunca del payload del mensaje.

---

## HALLAZGOS DE SEVERIDAD MEDIA

### M-01: CORS Wildcard en WebSocket
**OWASP:** A05:2021 - Security Misconfiguration  
**Archivo:** `apps/api/src/chat/chat.gateway.ts` linea 14  
**Descripcion:** `cors: { origin: '*' }` permite conexiones desde cualquier dominio.  
**Remediacion:** Usar el mismo `CORS_ORIGIN` configurado en main.ts.

### M-02: Throttling No Aplicado a WebSocket
**OWASP API:** API4:2023 - Unrestricted Resource Consumption  
**Archivo:** `apps/api/src/chat/chat.gateway.ts`  
**Descripcion:** El ThrottlerModule solo protege endpoints HTTP. Los mensajes WebSocket no tienen rate limiting, permitiendo spam de mensajes y consumo masivo de tokens AI.  
**Remediacion:** Implementar un rate limiter custom en el gateway (ej. max 5 mensajes/minuto por usuario).

### M-03: Sin Validacion DTO en Practice y Translation Controllers
**OWASP:** A03:2021 - Injection  
**Archivos:** `practice.controller.ts` linea 15, `translation.controller.ts` linea 12  
**Descripcion:** Los body parameters se reciben como objetos sin clase DTO y sin decoradores de validacion. El `skillType` y `cefrLevel` se pasan como `string` sin validar contra los enums permitidos.

```typescript
@Body() body: { skillType: string; cefrLevel: string } // Sin DTO ni validacion
@Body() body: { text: string } // Sin DTO ni validacion
```

**Remediacion:** Crear DTOs con class-validator:
```typescript
class CreatePracticeSessionDto {
  @IsEnum(SkillType) skillType: SkillType;
  @IsEnum(CefrLevel) cefrLevel: CefrLevel;
}
```

### M-04: Tokens Almacenados Solo en Memoria (Frontend)
**OWASP:** A07:2021 - Identification and Authentication Failures  
**Archivo:** `apps/web/src/stores/auth.store.ts`  
**Descripcion:** Los tokens se almacenan solo en el estado de Zustand (memoria). Se pierden al refrescar la pagina. No hay persistencia ni refresh automatico.  
**Remediacion:**
1. Almacenar refreshToken en httpOnly cookie (requiere cambio en backend)
2. Implementar intercepcion de 401 para auto-refresh
3. Si se usa localStorage, implementar cifrado y limpieza al logout

### M-05: Error Filter Expone Stack Traces Internos
**CWE-209:** Information Exposure Through Error Message  
**Archivo:** `apps/api/src/common/filters/http-exception.filter.ts` lineas 15-17  
**Descripcion:** Para excepciones no-HttpException, el mensaje generico "Internal server error" es correcto, pero no se registra el error real en logs estructurados.  
**Remediacion:** Agregar logging del error original para debugging sin exponer detalles al cliente.

---

## HALLAZGOS DE SEVERIDAD BAJA

### B-01: JWT Secret Debil en Desarrollo
**Archivo:** `apps/api/.env` linea 19  
**Descripcion:** `JWT_SECRET=your-super-secret-jwt-key-change-in-production` es un valor predecible.  
**Remediacion:** Generar un secret aleatorio de 256+ bits: `openssl rand -base64 64`

### B-02: Sin Limpieza de Refresh Tokens Expirados
**Archivo:** `apps/api/src/auth/auth.service.ts`  
**Descripcion:** Los refresh tokens expirados nunca se eliminan de la base de datos.  
**Remediacion:** Implementar un cron job que ejecute `DELETE FROM refresh_tokens WHERE expires_at < NOW()`.

### B-03: Sin Content-Security-Policy Personalizada
**Archivo:** `apps/api/src/main.ts` linea 12  
**Descripcion:** Helmet se usa con configuracion por defecto. Se recomienda personalizar CSP.  
**Remediacion:** Configurar Helmet con CSP especifica para la aplicacion.

---

## Matriz OWASP Top 10 (2021)

| # | Categoria | Estado | Observacion |
|---|-----------|--------|-------------|
| A01 | Broken Access Control | PARCIAL | Auth en HTTP OK, falta en WebSocket (C-02, A-04) |
| A02 | Cryptographic Failures | PARCIAL | bcrypt para passwords OK, refresh tokens sin hash (A-03) |
| A03 | Injection | PARCIAL | ValidationPipe OK para HTTP, falta en WS y DTOs (M-03, A-01) |
| A04 | Insecure Design | OK | Separacion de concerns, capas bien definidas |
| A05 | Security Misconfiguration | PARCIAL | Helmet OK, CORS WS abierto (M-01) |
| A06 | Vulnerable Components | OK | Dependencias actualizadas |
| A07 | Auth Failures | PARCIAL | JWT implementado, storage frontend debil (M-04) |
| A08 | Software/Data Integrity | OK | No se cargan recursos externos no validados |
| A09 | Logging & Monitoring | PARCIAL | Logger basico, falta audit trail |
| A10 | SSRF | OK | No hay endpoints que procesen URLs externas |

---

## Recomendaciones Prioritarias

1. **Inmediato:** Autenticar WebSocket gateway con JWT (C-02 + A-04)
2. **Inmediato:** Rotar API key de Gemini expuesta (C-01)
3. **Corto plazo:** Crear DTOs con validacion para Practice y Translation (M-03)
4. **Corto plazo:** Implementar rate limiting en WebSocket (M-02)
5. **Corto plazo:** Agregar try/catch y schema validation a JSON.parse de AI (A-02)
6. **Medio plazo:** Hashear refresh tokens (A-03)
7. **Medio plazo:** Implementar httpOnly cookies para tokens (M-04)
8. **Medio plazo:** Agregar filtro de prompt injection (A-01)
