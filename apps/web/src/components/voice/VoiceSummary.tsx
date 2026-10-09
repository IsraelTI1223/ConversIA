'use client';

import { useRouter } from 'next/navigation';
import type { VoiceSummary as VoiceSummaryType } from '@/hooks/useVoiceChat';

export function VoiceSummary({ summary }: { summary: VoiceSummaryType }) {
  const router = useRouter();

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <h2
        className="brutal-heading"
        style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        Session Summary
      </h2>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <div className="brutal-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800,
            color: 'var(--color-primary)',
          }}>
            {summary.totalTurns}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}>
            Turns
          </div>
        </div>
        <div className="brutal-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800,
            color: summary.corrections.length === 0 ? 'var(--color-turquesa)' : 'var(--color-yellow)',
          }}>
            {summary.corrections.length}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}>
            Corrections
          </div>
        </div>
        <div className="brutal-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800,
            color: 'var(--color-secondary)',
          }}>
            {summary.vocabulary.length}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}>
            New Words
          </div>
        </div>
      </div>

      {/* Corrections */}
      {summary.corrections.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Corrections
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {summary.corrections.map((c, i) => (
              <div
                key={i}
                style={{
                  border: 'var(--border-brutal)',
                  padding: '0.75rem',
                  background: 'var(--color-surface)',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--color-red)',
                  textDecoration: 'line-through',
                  marginBottom: '0.25rem',
                }}>
                  {c.original}
                </div>
                {c.correction && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--color-turquesa)',
                    fontWeight: 600,
                  }}>
                    {c.correction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {summary.vocabulary.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Vocabulary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {summary.vocabulary.map((v, i) => (
              <div
                key={i}
                style={{
                  border: 'var(--border-brutal)',
                  padding: '0.75rem',
                  background: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}>
                    {v.wordEn}
                  </span>
                  {v.phonetic && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {v.phonetic}
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}>
                    {v.wordEs}
                  </span>
                </div>
                {v.exampleEn && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.375rem',
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{v.exampleEn}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/practice')}
          className="brutal-btn"
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '0.75rem',
            border: 'var(--border-brutal-thick)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-brutal-sm)',
          }}
        >
          Practice Words
        </button>
        <button
          onClick={() => router.push('/voice')}
          className="brutal-btn"
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '0.75rem',
            border: 'var(--border-brutal-thick)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-brutal-sm)',
          }}
        >
          New Conversation
        </button>
      </div>
    </div>
  );
}
