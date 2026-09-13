'use client';

import React, { useState } from 'react';
import { AppNav } from '@/components/ui/AppNav';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { MicButton } from '@/components/ui/MicButton';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

const SKILL_ICONS: Record<string, React.ReactNode> = {
  WRITING: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  SPEAKING: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="1" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  READING: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  LISTENING: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
};

const SKILLS = [
  { id: 'WRITING', label: 'Writing', desc: 'Completa oraciones, ordena palabras, escribe párrafos', bg: 'var(--color-primary)' },
  { id: 'SPEAKING', label: 'Speaking', desc: 'Pronunciación, describe imágenes, roleplay', bg: 'var(--color-turquesa)' },
  { id: 'READING', label: 'Reading', desc: 'Lee pasajes y responde preguntas de comprensión', bg: 'var(--color-secondary)' },
  { id: 'LISTENING', label: 'Listening', desc: 'Escucha audio y responde preguntas', bg: 'var(--color-yellow)' },
];

interface Exercise {
  id: string;
  type?: string;
  instructions?: { en: string; es: string };
  prompt?: string;
  expectedAnswer?: string;
  hints?: string[];
  passage?: string;
  audioText?: string;
  keyPhrases?: string[];
  questions?: {
    type: string;
    questionEn: string;
    questionEs: string;
    options?: string[];
    correctAnswer: string;
  }[];
}

interface EvalResult {
  score: number;
  feedbackEn: string;
  feedbackEs: string;
  correctedAnswer?: string;
  pronunciationNotes?: string[];
  explanations?: string[];
}

type ViewState = 'select' | 'loading' | 'exercise' | 'submitting' | 'result';

export default function PracticePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('select');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const cefrLevel = user?.profile?.cefrLevel || 'A1';

  const handleGenerate = async () => {
    if (!selected) return;
    setError(null);
    setView('loading');
    try {
      const res = await api.post<{ session: any; exercise: Exercise }>('/practice/sessions', {
        skillType: selected,
        cefrLevel,
      });
      setExercise(res.exercise);
      setAnswer('');
      setAnswers({});
      setView('exercise');
    } catch (err: any) {
      setError(err?.message || 'Error al generar el ejercicio');
      setView('select');
    }
  };

  const handleSubmit = async () => {
    if (!exercise) return;
    setError(null);
    setView('submitting');

    let finalAnswer = answer;
    if (exercise.questions && exercise.questions.length > 0) {
      finalAnswer = exercise.questions
        .map((_, i) => answers[i] || '')
        .join(' | ');
    }

    try {
      const res = await api.post<EvalResult>(`/practice/exercises/${exercise.id}/submit`, {
        answer: finalAnswer,
      });
      setResult(res);
      setView('result');
    } catch (err: any) {
      setError(err?.message || 'Error al evaluar la respuesta');
      setView('exercise');
    }
  };

  const handleReset = () => {
    setView('select');
    setExercise(null);
    setAnswer('');
    setAnswers({});
    setResult(null);
    setError(null);
  };

  const hasQuestions = exercise?.questions && exercise.questions.length > 0;
  const isWritingOrSpeaking = selected === 'WRITING' || selected === 'SPEAKING';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppNav />

      <div className="max-w-3xl mx-auto" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        {view === 'select' && (
          <>
            <h1 className="brutal-heading mb-2" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
              Practica
            </h1>
            <p className="mb-6" style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
            }}>
              Elige una habilidad para practicar con tu vocabulario capturado en las conversaciones.
            </p>

            {error && (
              <div style={{
                border: '3px solid var(--color-red)',
                background: 'rgba(255, 107, 107, 0.15)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--color-red)',
              }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => setSelected(skill.id)}
                  className="text-left cursor-pointer p-6"
                  style={{
                    border: 'var(--border-brutal-thick)',
                    boxShadow: selected === skill.id ? 'var(--shadow-brutal-lg)' : 'var(--shadow-brutal)',
                    background: selected === skill.id ? skill.bg : 'var(--color-surface)',
                    color: selected === skill.id
                      ? (skill.bg === 'var(--color-secondary)' ? '#fff' : '#1A1A2E')
                      : 'var(--color-text)',
                    transform: selected === skill.id ? 'translate(-3px, -3px)' : 'none',
                    transition: 'all 0.1s',
                  }}
                >
                  <span className="block mb-3" style={{ opacity: 0.85 }}>{SKILL_ICONS[skill.id]}</span>
                  <span className="brutal-heading block text-xl mb-2">
                    {skill.label}
                  </span>
                  <span style={{
                    fontSize: '0.82rem',
                    opacity: selected === skill.id ? 0.85 : 0.65,
                    lineHeight: 1.4,
                  }}>
                    {skill.desc}
                  </span>
                </button>
              ))}
            </div>

            {selected && (
              <button
                type="button"
                onClick={handleGenerate}
                className="brutal-btn brutal-btn-primary w-full"
                style={{ fontSize: '1.1rem', padding: '1.125rem' }}
              >
                Generar Ejercicio de {SKILLS.find((s) => s.id === selected)?.label}
              </button>
            )}
          </>
        )}

        {view === 'loading' && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              animation: 'typing-bounce 1.2s infinite',
            }}>
              {selected && SKILL_ICONS[selected]}
            </div>
            <p className="brutal-heading" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Generando ejercicio...
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              La IA está creando un ejercicio de {SKILLS.find((s) => s.id === selected)?.label} nivel {cefrLevel}
            </p>
          </div>
        )}

        {view === 'submitting' && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              animation: 'typing-bounce 1.2s infinite',
            }}>
              🧠
            </div>
            <p className="brutal-heading" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Evaluando tu respuesta...
            </p>
          </div>
        )}

        {view === 'exercise' && exercise && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  border: 'var(--border-brutal)',
                  background: SKILLS.find((s) => s.id === selected)?.bg,
                  color: '#1A1A2E',
                  padding: '0.25rem 0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  marginRight: '0.5rem',
                }}>
                  {selected}
                </span>
                <span style={{
                  display: 'inline-block',
                  border: 'var(--border-brutal)',
                  background: 'var(--color-lime)',
                  color: '#1A1A2E',
                  padding: '0.25rem 0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {cefrLevel}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  border: 'var(--border-brutal)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  padding: '0.375rem 0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                VOLVER
              </button>
            </div>

            {error && (
              <div style={{
                border: '3px solid var(--color-red)',
                background: 'rgba(255, 107, 107, 0.15)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--color-red)',
              }}>
                {error}
              </div>
            )}

            {exercise.instructions && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                  INSTRUCTIONS
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>{exercise.instructions.en}</p>
                  <SpeakButton text={exercise.instructions.en} />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem', fontStyle: 'italic' }}>
                  {exercise.instructions.es}
                </p>
              </div>
            )}

            {exercise.passage && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                  READING PASSAGE
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7, flex: 1 }}>{exercise.passage}</p>
                  <SpeakButton text={exercise.passage} />
                </div>
              </div>
            )}

            {exercise.audioText && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.75rem' }}>
                  LISTENING
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>🔊</span>
                  <SpeakButton text={exercise.audioText} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Haz clic para escuchar
                  </span>
                </div>
              </div>
            )}

            {exercise.prompt && isWritingOrSpeaking && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                  EXERCISE
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, fontWeight: 600, flex: 1 }}>{exercise.prompt}</p>
                  <SpeakButton text={exercise.prompt} />
                </div>
              </div>
            )}

            {exercise.hints && exercise.hints.length > 0 && (
              <div style={{
                border: '2px dashed var(--color-yellow)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-yellow)', fontSize: '0.65rem' }}>
                  HINTS:
                </span>
                {exercise.hints.map((h, i) => (
                  <span key={i} style={{ marginLeft: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    {h}{i < exercise.hints!.length - 1 ? ' |' : ''}
                  </span>
                ))}
              </div>
            )}

            {hasQuestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {exercise.questions!.map((q, i) => (
                  <div key={i} style={{
                    border: 'var(--border-brutal)',
                    background: 'var(--color-surface)',
                    padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.5rem',
                        height: '1.5rem',
                        border: 'var(--border-brutal)',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{q.questionEn}</p>
                          <SpeakButton text={q.questionEn} compact />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          {q.questionEs}
                        </p>
                      </div>
                    </div>

                    {q.options && q.options.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {q.options.map((opt, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [i]: opt })}
                            style={{
                              border: answers[i] === opt ? '3px solid var(--color-primary)' : 'var(--border-brutal)',
                              background: answers[i] === opt ? 'var(--color-primary)' : 'var(--color-bg)',
                              color: answers[i] === opt ? '#fff' : 'var(--color-text)',
                              padding: '0.5rem 0.75rem',
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.1s',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[i] || ''}
                        onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                        placeholder="Type your answer..."
                        style={{
                          width: '100%',
                          border: 'var(--border-brutal)',
                          background: 'var(--color-bg)',
                          color: 'var(--color-text)',
                          padding: '0.625rem 0.75rem',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                    YOUR ANSWER
                  </div>
                  {selected === 'SPEAKING' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                        Use your microphone
                      </span>
                      <MicButton onTranscript={(text) => setAnswer(text)} lang="en-US" timed maxSeconds={300} />
                    </div>
                  )}
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={selected === 'SPEAKING' ? 'Click the microphone or type what you would say...' : 'Write your answer here...'}
                  rows={4}
                  style={{
                    width: '100%',
                    border: 'var(--border-brutal)',
                    boxShadow: 'var(--shadow-brutal-sm)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    padding: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={hasQuestions
                ? Object.keys(answers).length < (exercise.questions?.length || 0)
                : !answer.trim()
              }
              className="brutal-btn brutal-btn-primary w-full"
              style={{
                fontSize: '1.1rem',
                padding: '1.125rem',
                opacity: (hasQuestions ? Object.keys(answers).length < (exercise.questions?.length || 0) : !answer.trim()) ? 0.5 : 1,
              }}
            >
              Enviar Respuesta
            </button>
          </div>
        )}

        {view === 'result' && result && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '7rem',
                height: '7rem',
                border: 'var(--border-brutal-thick)',
                boxShadow: 'var(--shadow-brutal-lg)',
                background: result.score >= 80
                  ? 'var(--color-lime)'
                  : result.score >= 50
                    ? 'var(--color-yellow)'
                    : 'var(--color-red)',
                color: '#1A1A2E',
                marginBottom: '1rem',
              }}>
                <span className="brutal-heading" style={{ fontSize: '2.5rem' }}>
                  {result.score}
                </span>
              </div>
              <p className="brutal-heading" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                {result.score >= 80 ? 'Excellent!' : result.score >= 50 ? 'Good effort!' : 'Keep practicing!'}
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {result.score >= 80 ? 'Excelente!' : result.score >= 50 ? 'Buen esfuerzo!' : 'Sigue practicando!'}
              </p>
            </div>

            <div style={{
              border: 'var(--border-brutal)',
              boxShadow: 'var(--shadow-brutal)',
              background: 'var(--color-surface)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                FEEDBACK
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>{result.feedbackEn}</p>
                <SpeakButton text={result.feedbackEn} />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {result.feedbackEs}
              </p>
            </div>

            {result.correctedAnswer && (
              <div style={{
                border: '3px solid var(--color-lime)',
                background: 'rgba(0, 255, 127, 0.08)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-lime)', marginBottom: '0.5rem' }}>
                  CORRECTED ANSWER
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>{result.correctedAnswer}</p>
                  <SpeakButton text={result.correctedAnswer} />
                </div>
              </div>
            )}

            {result.pronunciationNotes && result.pronunciationNotes.length > 0 && (
              <div style={{
                border: 'var(--border-brutal)',
                background: 'var(--color-surface)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                  PRONUNCIATION NOTES
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {result.pronunciationNotes.map((note, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.25rem' }}>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.explanations && result.explanations.length > 0 && (
              <div style={{
                border: 'var(--border-brutal)',
                background: 'var(--color-surface)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                  EXPLANATIONS
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {result.explanations.map((exp, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.25rem' }}>
                      {exp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleGenerate}
                className="brutal-btn brutal-btn-primary"
                style={{ flex: 1, fontSize: '1rem', padding: '1rem' }}
              >
                Nuevo Ejercicio
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  flex: 1,
                  border: 'var(--border-brutal)',
                  boxShadow: 'var(--shadow-brutal)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
              >
                Cambiar Habilidad
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
