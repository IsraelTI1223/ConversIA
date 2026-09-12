# ConversIA - Contratos de API

## 1. Autenticacion

### POST /api/auth/register
```json
// Request
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "displayName": "Carlos Garcia",
  "nativeLanguage": "es",
  "targetLanguage": "en"
}

// Response 201
{
  "user": {
    "id": "cuid_123",
    "email": "user@example.com",
    "displayName": "Carlos Garcia",
    "cefrLevel": "A1",
    "createdAt": "2026-09-04T10:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 900
  }
}

// Response 409 - Email ya registrado
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

### POST /api/auth/login
```json
// Request
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}

// Response 200
{
  "user": {
    "id": "cuid_123",
    "email": "user@example.com",
    "displayName": "Carlos Garcia",
    "cefrLevel": "B1",
    "totalPoints": 1250,
    "streakDays": 7
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 900
  }
}

// Response 401
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### POST /api/auth/refresh
```json
// Request
{ "refreshToken": "eyJhbG..." }

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG_new...",
  "expiresIn": 900
}
```

---

## 2. Usuarios

### GET /api/users/profile
```json
// Response 200
{
  "id": "cuid_123",
  "email": "user@example.com",
  "displayName": "Carlos Garcia",
  "avatarUrl": null,
  "cefrLevel": "B1",
  "nativeLanguage": "es",
  "targetLanguage": "en",
  "totalPoints": 1250,
  "streakDays": 7,
  "lastActiveAt": "2026-09-04T15:30:00Z",
  "profile": {
    "bio": "Aprendiendo ingles para mi carrera",
    "learningGoal": "Hablar con fluidez en reuniones de trabajo",
    "dailyGoalMinutes": 15,
    "preferredTopics": ["technology", "business", "career"],
    "writingScore": 650,
    "speakingScore": 450,
    "readingScore": 800,
    "listeningScore": 600
  }
}
```

### PATCH /api/users/profile
```json
// Request
{
  "displayName": "Carlos A. Garcia",
  "cefrLevel": "B2",
  "profile": {
    "dailyGoalMinutes": 20,
    "preferredTopics": ["business", "technology"]
  }
}

// Response 200
{ "message": "Profile updated successfully" }
```

### GET /api/users/stats
```json
// Response 200
{
  "totalSessions": 42,
  "totalMinutes": 630,
  "totalVocabulary": 234,
  "masteredVocabulary": 89,
  "currentStreak": 7,
  "longestStreak": 15,
  "skillScores": {
    "writing": 650,
    "speaking": 450,
    "reading": 800,
    "listening": 600
  },
  "weeklyActivity": [
    { "date": "2026-09-01", "minutes": 15, "points": 45 },
    { "date": "2026-09-02", "minutes": 20, "points": 60 },
    { "date": "2026-09-03", "minutes": 10, "points": 30 },
    { "date": "2026-09-04", "minutes": 25, "points": 75 }
  ],
  "levelProgress": {
    "current": "B1",
    "pointsInLevel": 1250,
    "pointsToNextLevel": 2000,
    "percentage": 62.5
  }
}
```

---

## 3. Chat

### GET /api/chat/topics?level=B1
```json
// Response 200
{
  "level": "B1",
  "topics": [
    { "id": "current_events", "label": "Eventos Actuales", "labelEn": "Current Events" },
    { "id": "technology", "label": "Tecnologia", "labelEn": "Technology" },
    { "id": "environment", "label": "Medio Ambiente", "labelEn": "Environment" },
    { "id": "culture", "label": "Cultura y Tradiciones", "labelEn": "Culture & Traditions" },
    { "id": "career", "label": "Carrera Profesional", "labelEn": "Career" },
    { "id": "education", "label": "Educacion", "labelEn": "Education" }
  ]
}
```

### POST /api/chat/sessions
```json
// Request
{
  "cefrLevel": "B1",
  "topic": "technology",
  "durationMinutes": 15
}

// Response 201
{
  "sessionId": "cuid_sess_456",
  "cefrLevel": "B1",
  "topic": "technology",
  "topicLabel": "Tecnologia",
  "durationMinutes": 15,
  "audioSpeed": 1.0,
  "status": "ACTIVE",
  "startedAt": "2026-09-04T16:00:00Z",
  "wsToken": "ws_token_xyz",
  "openingMessage": {
    "contentEn": "Hi there! Let's talk about technology. What's the most useful app on your phone?",
    "contentEs": "Hola! Hablemos de tecnologia. Cual es la app mas util en tu telefono?",
    "vocabulary": [
      {
        "wordEn": "useful",
        "wordEs": "util",
        "phonetic": "/ˈjuːsfəl/",
        "exampleEn": "This app is very useful for learning English.",
        "exampleEs": "Esta app es muy util para aprender ingles.",
        "category": "adjective"
      }
    ]
  }
}
```

### PATCH /api/chat/sessions/:id/end
```json
// Response 200
{
  "sessionId": "cuid_sess_456",
  "status": "COMPLETED",
  "duration": {
    "configured": 15,
    "actual": 12.5
  },
  "stats": {
    "totalMessages": 18,
    "userMessages": 9,
    "aiMessages": 9,
    "correctMessages": 6,
    "incorrectMessages": 3,
    "accuracyRate": 66.7
  },
  "vocabularyCount": 8
}
```

### GET /api/chat/sessions/:id/vocabulary
```json
// Response 200
{
  "sessionId": "cuid_sess_456",
  "vocabulary": [
    {
      "id": "vocab_1",
      "wordEn": "breakthrough",
      "wordEs": "avance / descubrimiento",
      "phonetic": "/ˈbreɪkθruː/",
      "exampleEn": "The AI breakthrough changed everything.",
      "exampleEs": "El avance en IA cambio todo.",
      "category": "noun"
    },
    {
      "id": "vocab_2",
      "wordEn": "cutting-edge",
      "wordEs": "de vanguardia",
      "phonetic": "/ˈkʌtɪŋ edʒ/",
      "exampleEn": "They use cutting-edge technology.",
      "exampleEs": "Usan tecnologia de vanguardia.",
      "category": "adjective"
    }
  ]
}
```

---

## 4. WebSocket Events (Chat)

### Conexion
```
ws://api.conversia.com/chat?token=ws_token_xyz&sessionId=cuid_sess_456
```

### Client -> Server Events

```typescript
// Enviar mensaje
interface ChatMessageEvent {
  event: 'chat:message';
  data: {
    sessionId: string;
    content: string;         // Texto del usuario
    inputLanguage: 'en' | 'es'; // Idioma en que escribio
  };
}

// Indicador de escritura
interface TypingEvent {
  event: 'chat:typing';
  data: {
    sessionId: string;
    isTyping: boolean;
  };
}

// Cambiar velocidad de audio
interface AudioSpeedEvent {
  event: 'chat:audio-speed';
  data: {
    sessionId: string;
    speed: 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;
  };
}
```

### Server -> Client Events

```typescript
// Respuesta de la IA
interface ChatResponseEvent {
  event: 'chat:response';
  data: {
    messageId: string;
    contentEn: string;
    contentEs: string;
    correctionEn: string | null;
    isCorrect: boolean;
    vocabulary: VocabularyItem[];
    timestamp: string;
  };
}

// IA escribiendo
interface AiTypingEvent {
  event: 'chat:ai-typing';
  data: {
    isTyping: boolean;
  };
}

// Sesion terminada por timer
interface SessionEndedEvent {
  event: 'chat:session-ended';
  data: {
    reason: 'timer' | 'user' | 'error';
    stats: SessionStats;
  };
}

// Error
interface ChatErrorEvent {
  event: 'chat:error';
  data: {
    code: string;
    message: string;
  };
}
```

---

## 5. Practice

### POST /api/practice/sessions
```json
// Request
{
  "skillType": "WRITING",
  "cefrLevel": "B1",
  "vocabularyIds": ["vocab_1", "vocab_2", "vocab_3"],
  "exerciseCount": 5
}

// Response 201
{
  "sessionId": "pract_789",
  "skillType": "WRITING",
  "cefrLevel": "B1",
  "totalExercises": 5,
  "currentExercise": {
    "id": "ex_1",
    "exerciseType": "fill_blank",
    "instructions": {
      "en": "Complete the sentence with the correct word.",
      "es": "Completa la oracion con la palabra correcta."
    },
    "prompt": "The new AI ___ (breakthrough) changed the entire industry.",
    "hints": ["Use the noun form"],
    "maxPoints": 10
  }
}
```

### POST /api/practice/sessions/:id/submit
```json
// Request
{
  "exerciseId": "ex_1",
  "answer": "The new AI breakthrough changed the entire industry."
}

// Response 200
{
  "evaluation": {
    "isCorrect": true,
    "score": 10,
    "maxScore": 10,
    "feedback": {
      "en": "Perfect! 'Breakthrough' is correctly used as a noun here.",
      "es": "Perfecto! 'Breakthrough' esta correctamente usado como sustantivo aqui."
    }
  },
  "progress": {
    "completed": 1,
    "total": 5,
    "totalPoints": 10
  },
  "nextExercise": {
    "id": "ex_2",
    "exerciseType": "paragraph",
    "instructions": {
      "en": "Write 3 sentences about technology using the words: cutting-edge, breakthrough, innovative.",
      "es": "Escribe 3 oraciones sobre tecnologia usando las palabras: cutting-edge, breakthrough, innovative."
    },
    "maxPoints": 15
  }
}
```

---

## 6. Translation

### POST /api/translation/translate
```json
// Request
{
  "sourceText": "I have went to the store yesterday and I buyed some fruits. The weather was very cold and I don't liked it.",
  "sourceLang": "en",
  "targetLang": "es"
}

// Response 200
{
  "translation": {
    "text": "Fui a la tienda ayer y compre algunas frutas. El clima estaba muy frio y no me gusto.",
    "wordCount": 18
  },
  "analysis": {
    "overallScore": 55,
    "isCorrect": false,
    "errorCount": 3,
    "errors": [
      {
        "id": 1,
        "type": "grammar",
        "severity": "high",
        "original": "I have went",
        "corrected": "I went",
        "position": { "paragraph": 1, "sentence": 1 },
        "explanation": {
          "en": "Use simple past 'went' with 'yesterday', not present perfect 'have went'. Also, the past participle of 'go' is 'gone', not 'went'.",
          "es": "Usa el pasado simple 'went' con 'yesterday', no el presente perfecto 'have went'. Ademas, el participio pasado de 'go' es 'gone', no 'went'."
        }
      },
      {
        "id": 2,
        "type": "grammar",
        "severity": "high",
        "original": "I buyed",
        "corrected": "I bought",
        "position": { "paragraph": 1, "sentence": 1 },
        "explanation": {
          "en": "'Buy' is an irregular verb. The past tense is 'bought', not 'buyed'.",
          "es": "'Buy' es un verbo irregular. El pasado es 'bought', no 'buyed'."
        }
      },
      {
        "id": 3,
        "type": "grammar",
        "severity": "high",
        "original": "I don't liked",
        "corrected": "I didn't like",
        "position": { "paragraph": 1, "sentence": 2 },
        "explanation": {
          "en": "In past tense negatives, use 'didn't' + base form: 'didn't like'. 'Don't' is for present tense.",
          "es": "En negaciones en pasado, usa 'didn't' + forma base: 'didn't like'. 'Don't' es para presente."
        }
      }
    ]
  },
  "tips": [
    {
      "id": 1,
      "category": "irregular_verbs",
      "title": {
        "en": "Common Irregular Past Tenses",
        "es": "Pasados Irregulares Comunes"
      },
      "content": {
        "en": "Many common English verbs are irregular in past tense. Memorize these: go->went, buy->bought, see->saw, eat->ate, drink->drank.",
        "es": "Muchos verbos comunes en ingles son irregulares en pasado. Memoriza estos: go->went, buy->bought, see->saw, eat->ate, drink->drank."
      },
      "examples": [
        { "wrong": "buyed", "correct": "bought" },
        { "wrong": "goed", "correct": "went" }
      ]
    },
    {
      "id": 2,
      "category": "past_negatives",
      "title": {
        "en": "Past Tense Negatives",
        "es": "Negativos en Pasado"
      },
      "content": {
        "en": "To make a negative sentence in past tense: Subject + didn't + base verb. Never use 'don't' for past events.",
        "es": "Para hacer una oracion negativa en pasado: Sujeto + didn't + verbo base. Nunca uses 'don't' para eventos pasados."
      },
      "examples": [
        { "wrong": "I don't liked", "correct": "I didn't like" },
        { "wrong": "She don't went", "correct": "She didn't go" }
      ]
    }
  ],
  "summary": {
    "en": "Your text has some common errors with irregular verbs and past tense negatives. Focus on memorizing irregular verb forms and using 'didn't + base form' for past negatives.",
    "es": "Tu texto tiene algunos errores comunes con verbos irregulares y negativos en pasado. Enfocate en memorizar las formas irregulares y usar 'didn't + forma base' para negativos en pasado."
  }
}
```

---

## 7. Rate Limiting

```
Endpoints generales: 60 requests/min por usuario
Endpoints de IA: 10 requests/min por usuario
WebSocket messages: 30 messages/min por sesion

Headers de respuesta:
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693843200
```

---

## 8. Error Responses (Estandar)

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password is too weak"],
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You don't have access to this resource",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Session not found",
  "error": "Not Found"
}

// 429 Too Many Requests
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "error": "Too Many Requests",
  "retryAfter": 45
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```
