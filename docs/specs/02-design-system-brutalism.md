# ConversIA - Design System Brutalism

## 1. Filosofia de Diseno

**Neo-Brutalism** aplicado a una app educativa:
- Bordes gruesos y visibles (3-4px solid black)
- Sombras solidas desplazadas (box-shadow offset, sin blur)
- Colores saturados y contrastantes
- Tipografia bold y monospace para datos
- Esquinas rectas o ligeramente redondeadas (0-8px)
- Layouts con grid visible, espaciado generoso
- Interacciones con movimiento directo (sombra se reduce al hacer click)

---

## 2. Design Tokens

```css
/* conversia/apps/web/src/styles/brutalism-tokens.css */

:root {
  /* ===== COLORES PRIMARIOS ===== */
  --color-primary: #FF6B35;        /* Naranja vibrante - CTA principal */
  --color-secondary: #004E89;      /* Azul profundo - Elementos secundarios */
  --color-accent: #FCBF49;         /* Amarillo - Highlights, badges */
  --color-success: #2EC4B6;        /* Turquesa - Correcto, exito */
  --color-error: #E71D36;          /* Rojo - Errores, correcciones */
  --color-warning: #FF9F1C;        /* Naranja claro - Advertencias */

  /* ===== FONDOS ===== */
  --bg-primary: #FFFBF0;           /* Crema calido - Fondo principal */
  --bg-secondary: #F0E6D3;         /* Beige - Cards, paneles */
  --bg-chat-user: #D4F1F4;         /* Azul claro - Burbuja usuario */
  --bg-chat-ai: #FFF3E0;           /* Naranja claro - Burbuja IA */
  --bg-correct: #E8F8F5;           /* Verde claro - Mensaje correcto */
  --bg-incorrect: #FDEDEC;         /* Rojo claro - Mensaje incorrecto */

  /* ===== TEXTO ===== */
  --text-primary: #1A1A2E;         /* Casi negro - Texto principal */
  --text-secondary: #4A4A68;       /* Gris oscuro - Texto secundario */
  --text-muted: #8888AA;           /* Gris - Texto deshabilitado */
  --text-inverse: #FFFBF0;         /* Crema - Texto sobre fondos oscuros */

  /* ===== BORDES BRUTALISM ===== */
  --border-color: #1A1A2E;
  --border-width: 3px;
  --border-style: solid;
  --border: var(--border-width) var(--border-style) var(--border-color);

  /* ===== SOMBRAS BRUTALISM (sin blur) ===== */
  --shadow-sm: 2px 2px 0px var(--border-color);
  --shadow-md: 4px 4px 0px var(--border-color);
  --shadow-lg: 6px 6px 0px var(--border-color);
  --shadow-xl: 8px 8px 0px var(--border-color);
  --shadow-pressed: 1px 1px 0px var(--border-color);  /* Estado presionado */

  /* ===== TIPOGRAFIA ===== */
  --font-heading: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* ===== ESPACIADO ===== */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ===== BORDER RADIUS ===== */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* ===== BREAKPOINTS ===== */
  --bp-mobile: 375px;
  --bp-tablet: 768px;
  --bp-laptop: 1024px;
  --bp-desktop: 1280px;

  /* ===== TRANSICIONES ===== */
  --transition-fast: 100ms ease-in-out;
  --transition-base: 200ms ease-in-out;

  /* ===== Z-INDEX ===== */
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}

/* ===== DARK MODE ===== */
[data-theme="dark"] {
  --bg-primary: #1A1A2E;
  --bg-secondary: #2D2D44;
  --bg-chat-user: #1B3A4B;
  --bg-chat-ai: #3D2B1F;
  --bg-correct: #1A3D37;
  --bg-incorrect: #3D1A1A;

  --text-primary: #F0E6D3;
  --text-secondary: #B8B8CC;
  --text-muted: #6666888;
  --text-inverse: #1A1A2E;

  --border-color: #F0E6D3;

  --shadow-sm: 2px 2px 0px #F0E6D3;
  --shadow-md: 4px 4px 0px #F0E6D3;
  --shadow-lg: 6px 6px 0px #F0E6D3;
}
```

---

## 3. Componentes Base

### 3.1 Button (Brutalism)

```
Estilos:
- Borde grueso 3px solid negro
- Sombra solida desplazada (4px 4px)
- Al hacer hover: translate(-1px, -1px), sombra crece a 5px
- Al hacer click: translate(2px, 2px), sombra se reduce a 1px
- Texto bold, uppercase para CTA principales

Variantes:
- primary: bg naranja, texto blanco
- secondary: bg azul, texto blanco
- outline: bg transparente, borde negro
- success: bg turquesa, texto blanco
- danger: bg rojo, texto blanco
- ghost: sin borde, sin sombra (para iconos)

Tamanos:
- sm: padding 8px 16px, text 14px
- md: padding 12px 24px, text 16px
- lg: padding 16px 32px, text 18px
```

### 3.2 Card (Brutalism)

```
Estilos:
- Borde 3px solid negro
- Sombra solida 4px 4px
- Border-radius: 8px
- Padding: 24px
- Fondo: bg-secondary

Variantes:
- default: fondo beige
- elevated: fondo blanco, sombra 6px
- flat: sin sombra
- interactive: hover eleva la sombra
```

### 3.3 Chat Bubble (Brutalism)

```
Estructura:
+------------------------------------------+
| [Avatar] UserName          14:35          |
|------------------------------------------|
| English message text here                |
| Spanish translation text here (italic)   |
|------------------------------------------|
| [Play Audio] [Speed] | OK / Correction   |
+------------------------------------------+

Estilos User:
- Borde 2px solid azul oscuro
- Fondo: bg-chat-user
- Alineado a la derecha
- Border-radius: 12px 12px 0 12px

Estilos AI:
- Borde 2px solid naranja
- Fondo: bg-chat-ai
- Alineado a la izquierda
- Border-radius: 12px 12px 12px 0

Correccion:
- Si isCorrect: Badge verde "OK" con check
- Si !isCorrect: Badge rojo con el texto corregido
  - Texto original con tachado (line-through)
  - Texto corregido en verde debajo
```

### 3.4 Input Field (Brutalism)

```
Estilos:
- Borde 3px solid negro
- Sombra interna (inset) sutil
- Border-radius: 8px
- Padding: 12px 16px
- Focus: sombra se convierte en outline color primario

Variantes:
- text: input de texto estandar
- textarea: area de texto multilinea
- search: con icono de busqueda
```

### 3.5 Badge / Chip

```
Estilos:
- Borde 2px solid negro
- Border-radius: full (pill shape)
- Padding: 4px 12px
- Texto bold, text-sm
- Sombra: 2px 2px

Variantes por nivel CEFR:
- A1: bg #98D8C8 (verde claro)
- A2: bg #7EC8E3 (azul claro)
- B1: bg #FCBF49 (amarillo)
- B2: bg #FF6B35 (naranja)
- C1: bg #E71D36 (rojo)
- C2: bg #004E89 (azul oscuro), texto blanco
```

### 3.6 Progress Bar (Brutalism)

```
Estilos:
- Contenedor: borde 3px solid negro, height 24px, border-radius 4px
- Barra interior: color solido, sin gradientes
- Texto de porcentaje en bold sobre la barra
- Colores por contexto:
  - Vocabulario: naranja
  - Writing: azul
  - Speaking: turquesa
  - Reading: amarillo
  - Listening: rojo
```

---

## 4. Layouts Responsive

### 4.1 Desktop (>= 1024px)

```
+------+------------------------------------------+
| NAV  |  MAIN CONTENT                            |
| BAR  |                                           |
| (240)|  Dashboard: Grid 3 columnas              |
|      |  Chat: 2 columnas (chat + vocab sidebar)  |
|      |  Practice: Contenido centrado max-w-3xl    |
|      |  Translate: 2 columnas (input + output)   |
|      |                                           |
+------+------------------------------------------+
```

### 4.2 Tablet (768px - 1023px)

```
+------------------------------------------+
| TOP NAV BAR (hamburger + logo + avatar)  |
|------------------------------------------|
|  MAIN CONTENT                            |
|  Dashboard: Grid 2 columnas             |
|  Chat: Full width (vocab como drawer)    |
|  Practice: Full width con padding        |
|  Translate: Stacked (input arriba,       |
|             output abajo)                |
+------------------------------------------+
```

### 4.3 Mobile (<= 767px)

```
+---------------------------+
| TOP BAR (ham + logo)      |
|---------------------------|
|  MAIN CONTENT             |
|  Dashboard: 1 columna     |
|  Chat: Full width         |
|    - Input fijo abajo     |
|    - Vocab como modal     |
|  Practice: Full width     |
|  Translate: Stacked       |
|---------------------------|
| BOTTOM NAV (4 icons)      |
|  Home | Chat | Practice   |
|  Translate                |
+---------------------------+
```

---

## 5. Pantallas Principales

### 5.1 Login / Register

```
Layout centrado, max-w-md
+--------------------------------+
|                                |
|     [CONVERSIA LOGO]           |
|     "Learn English with AI"    |
|                                |
|  +----------------------------+|
|  | Email                      ||
|  +----------------------------+|
|  +----------------------------+|
|  | Password                   ||
|  +----------------------------+|
|                                |
|  [====== LOGIN ======]        |
|                                |
|  Don't have an account?       |
|  [Register here]              |
|                                |
+--------------------------------+
```

### 5.2 Dashboard

```
+------+------------------------------------------+
| NAV  | Welcome back, {{name}}!         [Avatar] |
|      |------------------------------------------|
|      | +----------+ +----------+ +----------+   |
|      | | Streak   | | Level    | | Points   |   |
|      | | 7 days   | | B1       | | 1,250    |   |
|      | +----------+ +----------+ +----------+   |
|      |                                           |
|      | +--------------------+                    |
|      | | Skills Progress    |                    |
|      | | Writing:  [====  ] 65%                  |
|      | | Speaking: [===   ] 45%                  |
|      | | Reading:  [=====] 80%                   |
|      | | Listening:[====  ] 60%                  |
|      | +--------------------+                    |
|      |                                           |
|      | +--------------------+ +----------------+ |
|      | | Recent Sessions    | | Vocabulary     | |
|      | | Chat: Travel B1    | | 234 words      | |
|      | | 15 min ago         | | 12 mastered    | |
|      | +--------------------+ +----------------+ |
+------+------------------------------------------+
```

### 5.3 Chat (Pre-session)

```
+------+------------------------------------------+
| NAV  | New Conversation                         |
|      |------------------------------------------|
|      |  Select your level:                      |
|      |  [A1] [A2] [B1*] [B2] [C1] [C2]        |
|      |                                          |
|      |  Select a topic:                         |
|      |  +------------------+ +----------------+ |
|      |  | Current Events   | | Technology     | |
|      |  +------------------+ +----------------+ |
|      |  | Environment      | | Culture        | |
|      |  +------------------+ +----------------+ |
|      |  | Career           | | Education      | |
|      |  +------------------+ +----------------+ |
|      |                                          |
|      |  Duration: [5] [10] [15*] [20] [30] min  |
|      |                                          |
|      |  [======= START CONVERSATION =======]    |
+------+------------------------------------------+
```

### 5.4 Chat (In-session)

```
+------+----------------------------+-----------+
| NAV  | Chat: Technology (B1)      | Vocab (8) |
|      | Timer: 12:35 remaining     |           |
|      | Audio Speed: [0.75x][1x*][1.5x]        |
|      |----------------------------|           |
|      | AI: Hi! Let's talk about   | word 1    |
|      |     technology...          | word 2    |
|      |     Hola! Hablemos de      | word 3    |
|      |     tecnologia...          | ...       |
|      |     [Play Audio]           |           |
|      |                            |           |
|      | USER: I thinks that AI     |           |
|      |       is very important    |           |
|      |       [Correction: "I      |           |
|      |        think" not "thinks"]|           |
|      |       Creo que la IA es    |           |
|      |       muy importante       |           |
|      |       [Play Audio]         |           |
|      |                            |           |
|      |----------------------------|           |
|      | [Mic EN|ES] [Type here...] [Send]      |
|      |             [Voice Input]              |
+------+----------------------------+-----------+
```

### 5.5 Chat (Post-session - Vocabulary Review)

```
+------+------------------------------------------+
| NAV  | Session Summary                          |
|      | Topic: Technology | Level: B1 | 15 min   |
|      |------------------------------------------|
|      | Vocabulary Learned (8 words)              |
|      |                                           |
|      | +--------------------------------------+  |
|      | | breakthrough  |  avance/descubrim.  |  |
|      | | /breɪkˈθruː/ |  [Play]              |  |
|      | | "The AI breakthrough changed..."     |  |
|      | +--------------------------------------+  |
|      | | cutting-edge  |  de vanguardia       |  |
|      | | /ˈkʌtɪŋ edʒ/  |  [Play]             |  |
|      | | "This is cutting-edge technology..." |  |
|      | +--------------------------------------+  |
|      | | ... more words ...                   |  |
|      |                                           |
|      | [== PRACTICE THIS VOCABULARY ==]          |
|      | [== START NEW CONVERSATION ==]            |
+------+------------------------------------------+
```

### 5.6 Practice Module

```
+------+------------------------------------------+
| NAV  | Practice                                 |
|      |------------------------------------------|
|      | Select a skill:                           |
|      | +---------+ +---------+                   |
|      | | Writing | |Speaking |                   |
|      | | 65 pts  | | 45 pts  |                   |
|      | +---------+ +---------+                   |
|      | +---------+ +---------+                   |
|      | | Reading | |Listening|                   |
|      | | 80 pts  | | 60 pts  |                   |
|      | +---------+ +---------+                   |
|      |                                           |
|      | Your vocabulary: 234 words                |
|      | Ready to practice: 45 words               |
|      |                                           |
|      | [== START PRACTICE ==]                    |
+------+------------------------------------------+
```

### 5.7 Translation Module

```
+------+------------------------------------------+
| NAV  | Translation                              |
|      |------------------------------------------|
|      | +------------------+ +------------------+ |
|      | | English Text     | | Spanish          | |
|      | |                  | | Translation      | |
|      | | Type or paste    | |                  | |
|      | | your English     | | (translated      | |
|      | | text here...     | |  text appears    | |
|      | |                  | |  here)           | |
|      | | 0/500 words      | |                  | |
|      | +------------------+ +------------------+ |
|      |                                           |
|      | [======== TRANSLATE ========]             |
|      |                                           |
|      | Tips & Corrections:                       |
|      | +--------------------------------------+  |
|      | | 1. Grammar: "I have went" should be  |  |
|      | |    "I have gone"                     |  |
|      | | 2. Word Choice: "make a travel"      |  |
|      | |    should be "take a trip"           |  |
|      | +--------------------------------------+  |
+------+------------------------------------------+
```

---

## 6. Iconografia

Usar **Lucide Icons** (open source, consistente):
- Home: `layout-dashboard`
- Chat: `message-circle`
- Practice: `book-open`
- Translate: `languages`
- Audio Play: `play-circle`
- Mic: `mic`
- Settings: `settings`
- User: `user`
- Timer: `timer`
- Check: `check-circle`
- Error: `x-circle`
- Vocabulary: `book-marked`

---

## 7. Animaciones y Microinteracciones

```
1. Botones:
   - Hover: translate(-1px, -1px), sombra crece
   - Click: translate(2px, 2px), sombra se reduce
   - Transicion: 100ms ease-in-out

2. Chat bubbles:
   - Entrada: slide-in desde abajo + fade-in (200ms)
   - Typing indicator: 3 dots pulsando

3. Timer:
   - Countdown con animacion de pulso en ultimos 60 segundos
   - Color cambia a rojo en ultimos 30 segundos

4. Score/Points:
   - Numero incrementa con animacion (count-up)
   - Badge de puntos aparece con scale + bounce

5. Correccion:
   - Texto incorrecto aparece con highlight rojo pulsante
   - Texto correcto aparece con slide-down suave
   - Badge "OK" aparece con pop animation

6. Dark mode toggle:
   - Transicion suave de colores (300ms)
```
