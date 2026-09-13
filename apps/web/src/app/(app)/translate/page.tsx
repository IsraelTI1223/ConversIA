'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { AppNav } from '@/components/ui/AppNav';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { MicButton } from '@/components/ui/MicButton';

interface TranslationError {
  category: string;
  original: string;
  corrected: string;
  explanationEn: string;
  explanationEs: string;
}

interface Tip {
  tipEn: string;
  tipEs: string;
  exampleWrong?: string;
  exampleCorrect?: string;
}

interface TranslationResult {
  translation: string;
  score: number;
  errors?: TranslationError[];
  tips?: Tip[];
  summary?: { en: string; es: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  grammar: 'var(--color-primary)',
  spelling: 'var(--color-red)',
  punctuation: 'var(--color-yellow)',
  word_choice: 'var(--color-turquesa)',
  style: 'var(--color-secondary)',
  register: 'var(--color-lime)',
};

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 500;

  const handleTranslate = async () => {
    if (!text.trim() || overLimit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<TranslationResult>('/translation', { text });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error al traducir. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppNav />
      <div className="max-w-3xl mx-auto" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <h1 className="brutal-heading mb-2" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
          Traducir
        </h1>
        <p className="mb-6" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
        }}>
          Escribe o dicta en ingles y recibe traduccion, analisis gramatical y tips de mejora.
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

        <div style={{
          border: 'var(--border-brutal)',
          boxShadow: 'var(--shadow-brutal)',
          background: 'var(--color-surface)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
              TEXTO EN INGLÉS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MicButton onTranscript={(t) => setText((prev) => prev ? prev + ' ' + t : t)} lang="en-US" />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                border: 'var(--border-brutal)',
                background: overLimit ? 'var(--color-red)' : 'var(--color-bg)',
                color: overLimit ? '#fff' : 'var(--color-text-secondary)',
              }}>
                {wordCount}/500
              </span>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Type, paste, or speak your English text here..."
            style={{
              width: '100%',
              border: 'var(--border-brutal)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              padding: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              resize: 'vertical',
              marginBottom: '1rem',
            }}
          />

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={!text.trim() || overLimit || loading}
              className="brutal-btn brutal-btn-primary"
              style={{
                flex: 1,
                padding: '1rem',
                fontSize: '1rem',
                opacity: (!text.trim() || overLimit || loading) ? 0.5 : 1,
              }}
            >
              {loading ? 'Traduciendo...' : 'Traducir y Analizar'}
            </button>
            {(text || result) && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  border: 'var(--border-brutal)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  padding: '1rem 1.5rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Score + Summary */}
            <div style={{
              border: 'var(--border-brutal)',
              boxShadow: 'var(--shadow-brutal)',
              background: 'var(--color-surface)',
              padding: '1.5rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'flex-start',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '5rem',
                height: '5rem',
                border: 'var(--border-brutal-thick)',
                boxShadow: 'var(--shadow-brutal)',
                background: result.score >= 80
                  ? 'var(--color-lime)'
                  : result.score >= 50
                    ? 'var(--color-yellow)'
                    : 'var(--color-red)',
                color: '#1A1A2E',
                flexShrink: 0,
              }}>
                <span className="brutal-heading" style={{ fontSize: '2rem' }}>
                  {result.score}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.375rem' }}>
                  SCORE
                </div>
                {result.summary && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{result.summary.en}</p>
                      <SpeakButton text={result.summary.en} compact />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                      {result.summary.es}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Translation */}
            <div style={{
              border: 'var(--border-brutal)',
              boxShadow: 'var(--shadow-brutal)',
              background: 'var(--color-surface)',
              padding: '1.25rem',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.5rem' }}>
                TRADUCCIÓN
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <p style={{ fontSize: '1rem', lineHeight: 1.7, flex: 1 }}>{result.translation}</p>
                <SpeakButton text={result.translation} lang="es-ES" />
              </div>
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: '0.75rem' }}>
                  ERRORES ENCONTRADOS ({result.errors.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{
                      border: 'var(--border-brutal)',
                      background: 'var(--color-bg)',
                      padding: '0.875rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.125rem 0.375rem',
                          border: '2px solid',
                          borderColor: CATEGORY_COLORS[err.category] || 'var(--color-text-secondary)',
                          color: CATEGORY_COLORS[err.category] || 'var(--color-text-secondary)',
                        }}>
                          {err.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          background: 'rgba(255, 107, 107, 0.2)',
                          border: '2px solid var(--color-red)',
                          textDecoration: 'line-through',
                        }}>
                          {err.original}
                        </span>
                        <span style={{ fontWeight: 700 }}>→</span>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          background: 'rgba(0, 255, 127, 0.1)',
                          border: '2px solid var(--color-lime)',
                        }}>
                          {err.corrected}
                        </span>
                        <SpeakButton text={err.corrected} compact />
                      </div>
                      <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{err.explanationEn}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.125rem' }}>
                        {err.explanationEs}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <div style={{
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                background: 'var(--color-surface)',
                padding: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  TIPS DE MEJORA
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.tips.map((tip, i) => (
                    <div key={i} style={{
                      border: '2px dashed var(--color-primary)',
                      padding: '0.875rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.25rem',
                          height: '1.25rem',
                          border: 'var(--border-brutal)',
                          background: 'var(--color-primary)',
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.6rem',
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 600, flex: 1 }}>{tip.tipEn}</p>
                            <SpeakButton text={tip.tipEn} compact />
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.125rem' }}>
                            {tip.tipEs}
                          </p>
                        </div>
                      </div>
                      {tip.exampleCorrect && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          marginLeft: '1.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                        }}>
                          <span style={{
                            padding: '0.15rem 0.375rem',
                            background: 'rgba(255, 107, 107, 0.2)',
                            border: '1.5px solid var(--color-red)',
                          }}>
                            {tip.exampleWrong}
                          </span>
                          <span style={{ fontWeight: 700 }}>→</span>
                          <span style={{
                            padding: '0.15rem 0.375rem',
                            background: 'rgba(0, 255, 127, 0.1)',
                            border: '1.5px solid var(--color-lime)',
                          }}>
                            {tip.exampleCorrect}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New translation button */}
            <button
              type="button"
              onClick={handleReset}
              className="brutal-btn brutal-btn-primary w-full"
              style={{ padding: '1rem', fontSize: '1rem' }}
            >
              Nueva Traducción
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
