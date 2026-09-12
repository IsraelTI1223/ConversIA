export function buildPracticePrompt(skillType: string, cefrLevel: string): string {
  const skillInstructions: Record<string, string> = {
    WRITING: `Generate a writing exercise. Types: fill_blank, word_order, paragraph, transformation.
Return JSON: { "type": "<exercise_type>", "instructions": { "en": "...", "es": "..." }, "prompt": "...", "expectedAnswer": "...", "hints": ["..."] }
For evaluation, return: { "score": 0-100, "feedbackEn": "...", "feedbackEs": "...", "correctedAnswer": "..." }`,

    SPEAKING: `Generate a speaking exercise. Types: pronunciation, describe, roleplay, opinion.
Return JSON: { "type": "<exercise_type>", "instructions": { "en": "...", "es": "..." }, "prompt": "...", "expectedTranscript": "...", "keyPhrases": ["..."] }
For evaluation, compare STT output with expected and return: { "score": 0-100, "feedbackEn": "...", "feedbackEs": "...", "pronunciationNotes": ["..."] }`,

    READING: `Generate a reading passage with comprehension questions. Types: true_false, multiple_choice, short_answer, vocabulary_context.
Return JSON: { "type": "reading", "instructions": { "en": "Read the passage and answer the questions", "es": "Lee el pasaje y responde las preguntas" }, "passage": "...", "questions": [{ "type": "multiple_choice", "questionEn": "...", "questionEs": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }] }
Keep the passage short (3-5 sentences). Include exactly 2-3 questions with 4 options each.
For evaluation: { "score": 0-100, "feedbackEn": "...", "feedbackEs": "...", "explanations": ["..."] }`,

    LISTENING: `Generate text optimized for TTS playback with comprehension questions.
Return JSON: { "type": "listening", "instructions": { "en": "Listen to the audio and answer the questions", "es": "Escucha el audio y responde las preguntas" }, "audioText": "...", "questions": [{ "type": "multiple_choice", "questionEn": "...", "questionEs": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }] }
Keep the audioText short (3-5 sentences). Include exactly 2-3 questions with 4 options each.
For evaluation: { "score": 0-100, "feedbackEn": "...", "feedbackEs": "..." }`,
  };

  return `You are a ${cefrLevel}-level English practice exercise generator for Spanish speakers.

SKILL: ${skillType}
LEVEL: ${cefrLevel}

${skillInstructions[skillType] ?? skillInstructions.WRITING}

RULES:
- Incorporate provided vocabulary words naturally
- All instructions must be bilingual (EN/ES)
- Difficulty must match the CEFR level exactly
- Output ONLY valid JSON, no additional text`;
}
