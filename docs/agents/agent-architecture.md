# ConversIA - Arquitectura de Agentes de IA

## 1. Vision General de Agentes

ConversIA utiliza un sistema de **agentes orquestados** donde un agente principal (Orchestrator) coordina sub-agentes especializados para cada tarea. Todos los agentes usan la API de Anthropic Claude.

```
                    +------------------------+
                    |   ORCHESTRATOR AGENT   |
                    |   (AI Service Layer)   |
                    +-----+-----+-----+-----+
                          |     |     |
              +-----------+  +--+--+  +----------+
              |              |     |              |
    +---------v---+  +-------v-+  +v---------+  +v-----------+
    | CHAT AGENT  |  |PRACTICE |  |TRANSLATION|  |VOCABULARY  |
    | (Main Conv) |  |AGENT    |  |AGENT      |  |AGENT       |
    +------+------+  +---------+  +-----------+  +------------+
           |
    +------+------+
    |             |
+---v----+  +----v-------+
|GRAMMAR |  |TRANSLATION |
|CHECKER |  |(Messages)  |
+--------+  +------------+
```

---

## 2. Agente: Orchestrator (ai.service.ts)

### Responsabilidades
- Recibir requests de los controladores
- Seleccionar el agente apropiado
- Construir el system prompt dinamico
- Manejar el historial de conversacion
- Parsear y validar respuestas de Claude
- Reintentar en caso de respuestas mal formateadas
- Logging y metricas de uso

### Configuracion
```typescript
// ai.service.ts

import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-5';

  // Configuracion por tipo de agente
  private readonly agentConfig = {
    chat: {
      model: 'claude-sonnet-5',
      maxTokens: 1024,
      temperature: 0.8,     // Mas creativo para conversacion natural
      topP: 0.95,
    },
    grammar: {
      model: 'claude-sonnet-5',
      maxTokens: 512,
      temperature: 0.2,     // Mas determinista para correccion
      topP: 0.9,
    },
    vocabulary: {
      model: 'claude-sonnet-5',
      maxTokens: 512,
      temperature: 0.5,
      topP: 0.9,
    },
    practice: {
      model: 'claude-sonnet-5',
      maxTokens: 1024,
      temperature: 0.6,
      topP: 0.9,
    },
    translation: {
      model: 'claude-sonnet-5',
      maxTokens: 2048,
      temperature: 0.3,     // Mas preciso para traduccion
      topP: 0.9,
    },
  };

  async chatMessage(params: ChatParams): Promise<ChatResponse> {
    // 1. Construir system prompt
    const systemPrompt = this.buildChatSystemPrompt(params);

    // 2. Construir historial de mensajes
    const messages = this.buildMessageHistory(params.history);

    // 3. Agregar mensaje del usuario
    messages.push({
      role: 'user',
      content: `[${params.inputLanguage.toUpperCase()}] ${params.content}`,
    });

    // 4. Llamar a Claude
    const response = await this.client.messages.create({
      ...this.agentConfig.chat,
      system: systemPrompt,
      messages,
    });

    // 5. Parsear respuesta JSON
    return this.parseChatResponse(response);
  }

  async generateExercise(params: PracticeParams): Promise<Exercise> {
    // Similar flow con agentConfig.practice
  }

  async translateText(params: TranslationParams): Promise<TranslationResult> {
    // Similar flow con agentConfig.translation
  }
}
```

---

## 3. Agente: Chat Conversacional

### Proposito
Mantener una conversacion natural en ingles con el usuario, adaptada a su nivel CEFR y tema seleccionado.

### Flujo de Procesamiento

```
User Message
     |
     v
[1. Input Classification]
  - Detectar idioma (en/es)
  - Detectar intencion (pregunta, respuesta, cambio de tema)
     |
     v
[2. Grammar Check] (si es en ingles)
  - Evaluar correccion
  - Generar correctionEn si hay errores
     |
     v
[3. Response Generation]
  - Responder naturalmente al contenido
  - Mantener el tema seleccionado
  - Adaptar complejidad al nivel CEFR
     |
     v
[4. Translation]
  - Traducir respuesta EN -> ES
     |
     v
[5. Vocabulary Extraction]
  - Identificar 1-3 palabras nuevas
  - Generar ejemplos y fonetica
     |
     v
[6. Format Response]
  - Estructurar JSON de salida
  - Validar completitud
```

### Manejo de Contexto
```typescript
// Maximo de mensajes en contexto por nivel
const MAX_CONTEXT_MESSAGES = {
  A1: 10,   // Conversaciones cortas
  A2: 14,
  B1: 20,
  B2: 24,
  C1: 30,
  C2: 30,
};

// Si se excede, usar sliding window:
// Mantener primer mensaje + ultimos N mensajes
```

---

## 4. Agente: Grammar Checker

### Proposito
Evaluar la correccion gramatical del ingles escrito por el usuario.

### Invocacion
Se invoca como parte del flujo del Chat Agent, NO como agente separado.
El system prompt del chat ya incluye las reglas de correccion.

### Tolerancia por Nivel
```
A1: Solo errores criticos (conjugacion basica, orden de palabras)
A2: + articulos, plurales, preposiciones basicas
B1: + tiempos verbales, condicionales, collocations
B2: + voz pasiva, reported speech, matices
C1: + registro, precision lexica, estilo
C2: + sutilezas nativas, humor, doble sentido
```

---

## 5. Agente: Practice Generator

### Proposito
Generar y evaluar ejercicios de las 4 habilidades linguisticas.

### Sub-flujos por Skill

#### Writing
```
Input: vocabularyList, cefrLevel, exerciseNumber
     |
     v
[Generate Exercise]
  - Seleccionar tipo (fill_blank, word_order, paragraph, etc.)
  - Incluir vocabulary del usuario
  - Ajustar dificultad al nivel
     |
     v
[User Submits Answer]
     |
     v
[Evaluate Answer]
  - Comparar con expected answer
  - Si es free-form: evaluar gramatica, uso de vocabulary, coherencia
  - Generar feedback bilingue
  - Calcular puntos
```

#### Speaking
```
Input: vocabularyList, cefrLevel
     |
     v
[Generate Prompt]
  - Crear prompt verbal (pronunciation, roleplay, opinion)
  - Incluir texto esperado
     |
     v
[User Speaks -> STT -> Text]
     |
     v
[Compare Transcripts]
  - Comparar STT output con expected
  - Evaluar completitud, precision
  - Dar feedback de pronunciacion
```

#### Reading
```
Input: vocabularyList, cefrLevel
     |
     v
[Generate Passage]
  - Crear texto con vocabulary integrado
  - Longitud segun nivel (50-400 palabras)
     |
     v
[Generate Questions]
  - True/False, Multiple Choice, Short Answer
  - Vocabulary in context
     |
     v
[User Answers]
     |
     v
[Evaluate & Score]
```

#### Listening
```
Input: vocabularyList, cefrLevel
     |
     v
[Generate Audio Text]
  - Crear dialogo/monologo con vocabulary
  - Frontend convierte a audio via TTS
     |
     v
[Generate Questions]
  - Comprension auditiva
  - Fill in the blank (lo que escucharon)
     |
     v
[User Answers]
     |
     v
[Evaluate & Score]
```

---

## 6. Agente: Translation & Tips

### Proposito
Traducir texto ingles a espanol y proporcionar tips de mejora.

### Flujo
```
Input: sourceText (max 500 words), cefrLevel
     |
     v
[Validate Word Count]
  - Rechazar si > 500 palabras
     |
     v
[Translate]
  - Traduccion natural EN -> ES
  - Latin American Spanish
     |
     v
[Analyze Grammar]
  - Detectar errores por categoria
  - Asignar severidad (high/medium/low)
     |
     v
[Generate Tips]
  - Tips accionables con ejemplos
  - Relacionados a los errores encontrados
  - Bilingues (en + es)
     |
     v
[Format Response]
  - Score general (0-100)
  - Lista de errores con posicion
  - Lista de tips con ejemplos
  - Resumen general
```

---

## 7. Agente: Vocabulary Manager

### Proposito
Gestionar el vocabulario del usuario, calcular mastery y seleccionar palabras para practica.

### Logica (Server-side, no IA)
```typescript
// vocabulary.service.ts

@Injectable()
export class VocabularyService {

  // Agregar vocabulario de sesion de chat al usuario
  async mergeSessionVocabulary(
    userId: string,
    sessionVocab: SessionVocabulary[]
  ): Promise<void> {
    for (const word of sessionVocab) {
      await this.prisma.userVocabulary.upsert({
        where: {
          userId_wordEn: { userId, wordEn: word.wordEn },
        },
        create: {
          userId,
          wordEn: word.wordEn,
          wordEs: word.wordEs,
          phonetic: word.phonetic,
          exampleEn: word.exampleEn,
          exampleEs: word.exampleEs,
          category: word.category,
          mastery: 0,
        },
        update: {
          // No sobreescribir si ya existe
        },
      });
    }
  }

  // Seleccionar vocabulario para practica
  // Prioriza: bajo mastery + no practicado recientemente
  async getVocabularyForPractice(
    userId: string,
    count: number = 10
  ): Promise<UserVocabulary[]> {
    return this.prisma.userVocabulary.findMany({
      where: {
        userId,
        mastery: { lt: 80 }, // Solo vocabulario no dominado
      },
      orderBy: [
        { mastery: 'asc' },
        { lastPracticedAt: 'asc' },
      ],
      take: count,
    });
  }

  // Actualizar mastery despues de practica
  async updateMastery(
    userId: string,
    wordEn: string,
    isCorrect: boolean
  ): Promise<void> {
    const increment = isCorrect ? 10 : -5;

    await this.prisma.userVocabulary.update({
      where: {
        userId_wordEn: { userId, wordEn },
      },
      data: {
        mastery: {
          increment: increment,
          // Clamped to 0-100 via database trigger or app logic
        },
        practiceCount: { increment: 1 },
        lastPracticedAt: new Date(),
      },
    });

    // Clamp mastery between 0 and 100
    await this.prisma.$executeRaw`
      UPDATE "UserVocabulary"
      SET mastery = LEAST(GREATEST(mastery, 0), 100)
      WHERE "userId" = ${userId} AND "wordEn" = ${wordEn}
    `;
  }
}
```

---

## 8. Manejo de Errores de IA

```typescript
// ai.service.ts - Error handling

private async callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  context: string = 'ai_call'
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        // Esperar y reintentar
        await this.delay(2000 * (attempt + 1));
        continue;
      }

      if (error instanceof SyntaxError) {
        // Respuesta JSON mal formateada
        this.logger.warn(`JSON parse error on attempt ${attempt}`, context);
        if (attempt < maxRetries) continue;
      }

      this.logger.error(`AI call failed: ${context}`, error);
      throw new InternalServerErrorException(
        'AI service temporarily unavailable'
      );
    }
  }

  throw new InternalServerErrorException('AI service failed after retries');
}
```

---

## 9. Costos y Limites

### Estimacion de Tokens por Interaccion
```
Chat Message:
  - System prompt: ~800 tokens
  - Historial (20 msgs): ~2,000 tokens
  - User message: ~50 tokens
  - AI response: ~300 tokens
  - Total per message: ~3,150 tokens
  - Costo estimado (Sonnet): ~$0.015 por mensaje

Practice Exercise:
  - System prompt: ~500 tokens
  - Context: ~200 tokens
  - Response: ~400 tokens
  - Total: ~1,100 tokens
  - Costo estimado: ~$0.005 por ejercicio

Translation:
  - System prompt: ~600 tokens
  - Input text (500 words): ~700 tokens
  - Response: ~1,500 tokens
  - Total: ~2,800 tokens
  - Costo estimado: ~$0.014 por traduccion
```

### Limites por Usuario (Free Tier)
```
- 10 sesiones de chat por dia
- 20 ejercicios de practica por dia
- 5 traducciones por dia
- Sesion maxima: 30 minutos
```
