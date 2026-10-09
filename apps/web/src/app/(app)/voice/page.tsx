'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/ui/AppNav';
import { VoiceMic } from '@/components/voice/VoiceMic';
import { VoiceSummary } from '@/components/voice/VoiceSummary';
import { useVoiceChat, VoiceTranscriptEntry } from '@/hooks/useVoiceChat';
import { api } from '@/lib/api';

const TOPICS = [
  { id: 'daily-life', label: 'Daily Life' },
  { id: 'travel', label: 'Travel' },
  { id: 'technology', label: 'Technology' },
  { id: 'food', label: 'Food & Cooking' },
  { id: 'work', label: 'Work & Career' },
  { id: 'health', label: 'Health' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'environment', label: 'Environment' },
];

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DURATIONS = [5, 10, 15, 20, 30];

function formatCountdown(expiresAt: number): string {
  const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SetupScreen({ onStart }: { onStart: (sessionId: string) => void }) {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('B1');
  const [duration, setDuration] = useState(10);
  const [creating, setCreating] = useState(false);

  const handleStart = async () => {
    if (!topic || creating) return;
    setCreating(true);
    try {
      const session = await api.post<{ id: string }>('/chat/sessions', {
        cefrLevel: level,
        topic: TOPICS.find((t) => t.id === topic)?.label ?? topic,
        mode: 'VOICE',
        durationMinutes: duration,
      });
      onStart(session.id);
    } catch {
      alert('Error creating session. Make sure you are logged in.');
      router.push('/login');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: '600px', margin: '0 auto' }}>
      <h1
        className="brutal-heading"
        style={{
          fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}
      >
        Live Talk
      </h1>
      <p style={{
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        marginBottom: '1.5rem',
      }}>
        Speak English live with AI — get corrections as you go
      </p>

      {/* Level */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'block',
          marginBottom: '0.5rem',
        }}>
          Level
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {CEFR.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'var(--border-brutal)',
                background: level === l ? 'var(--color-border)' : 'var(--color-surface)',
                color: level === l ? 'var(--color-bg)' : 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'block',
          marginBottom: '0.5rem',
        }}>
          Topic
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.375rem',
        }}>
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              style={{
                padding: '0.625rem',
                border: 'var(--border-brutal)',
                background: topic === t.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: topic === t.id ? '#fff' : 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'block',
          marginBottom: '0.5rem',
        }}>
          Duration (minutes)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              style={{
                padding: '0.5rem 1rem',
                border: 'var(--border-brutal)',
                background: duration === d ? 'var(--color-border)' : 'var(--color-surface)',
                color: duration === d ? 'var(--color-bg)' : 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={!topic || creating}
        style={{
          width: '100%',
          padding: '1rem',
          border: 'var(--border-brutal-thick)',
          background: !topic ? 'var(--color-surface-alt)' : 'var(--color-primary)',
          color: !topic ? 'var(--color-text-secondary)' : '#fff',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: !topic ? 'not-allowed' : 'pointer',
          boxShadow: !topic ? 'none' : 'var(--shadow-brutal)',
        }}
      >
        {creating ? 'Starting...' : 'Start Conversation'}
      </button>
    </div>
  );
}

function TranscriptBubble({ entry }: { entry: VoiceTranscriptEntry }) {
  const isUser = entry.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        maxWidth: 'min(85%, 500px)',
        border: 'var(--border-brutal)',
        boxShadow: 'var(--shadow-brutal-sm)',
        padding: '0.75rem 0.875rem',
        background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isUser ? '#fff' : 'var(--color-text)',
        wordBreak: 'break-word',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
          opacity: 0.7,
        }}>
          {isUser ? 'You' : 'ConversIA'}
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
          {entry.text}
        </p>

        {!isUser && entry.isCorrect === false && entry.correctionEn && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.5rem',
            border: '2px solid var(--color-yellow)',
            background: 'rgba(252, 191, 73, 0.1)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
          }}>
            <span style={{ fontWeight: 700 }}>Correction: </span>
            {entry.correctionEn}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationScreen({ sessionId }: { sessionId: string }) {
  const {
    turn,
    transcript,
    currentAiText,
    expiresAt,
    summary,
    error,
    isConnected,
    sendTranscript,
    endSession,
  } = useVoiceChat(sessionId);

  const [interimText, setInterimText] = useState('');
  const [countdown, setCountdown] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const onFinalTranscript = useCallback((text: string) => {
    setInterimText('');
    sendTranscript(text);
  }, [sendTranscript]);

  const onInterimTranscript = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentAiText]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (summary) {
    return <VoiceSummary summary={summary} />;
  }

  const turnLabel: Record<string, string> = {
    idle: 'Connecting...',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
  };

  const turnColor: Record<string, string> = {
    idle: 'var(--color-text-secondary)',
    listening: 'var(--color-turquesa)',
    processing: 'var(--color-yellow)',
    speaking: 'var(--color-primary)',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 60px)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem clamp(0.75rem, 2vw, 1rem)',
        borderBottom: 'var(--border-brutal)',
        background: 'var(--color-surface)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: isConnected ? 'var(--color-turquesa)' : 'var(--color-red)',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: turnColor[turn],
          }}>
            {turnLabel[turn]}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {countdown && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              border: 'var(--border-brutal)',
              padding: '0.25rem 0.5rem',
              background: 'var(--color-surface)',
            }}>
              {countdown}
            </span>
          )}
          <button
            onClick={endSession}
            style={{
              padding: '0.375rem 0.75rem',
              border: '2px solid var(--color-red)',
              background: 'transparent',
              color: 'var(--color-red)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            End
          </button>
        </div>
      </div>

      {/* Transcript area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
        }}
      >
        {transcript.length === 0 && turn === 'listening' && (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: 'var(--color-text-secondary)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1rem',
              border: 'var(--border-brutal-thick)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface)',
              animation: 'mic-pulse 1.5s infinite',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-turquesa)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="12" rx="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
              Start speaking in English
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              The AI will listen and respond
            </p>
          </div>
        )}

        {transcript.map((entry) => (
          <TranscriptBubble key={entry.id} entry={entry} />
        ))}

        {currentAiText && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              maxWidth: 'min(85%, 500px)',
              border: 'var(--border-brutal)',
              padding: '0.75rem 0.875rem',
              background: 'var(--color-surface)',
              opacity: 0.8,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
                opacity: 0.7,
              }}>
                ConversIA
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                {currentAiText}
                <span style={{ animation: 'mic-blink 0.8s infinite' }}>|</span>
              </p>
            </div>
          </div>
        )}

        {interimText && turn === 'listening' && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              maxWidth: 'min(85%, 500px)',
              border: '2px dashed var(--color-primary)',
              padding: '0.5rem 0.75rem',
              opacity: 0.6,
              fontStyle: 'italic',
              fontSize: '0.85rem',
            }}>
              {interimText}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'var(--color-red)',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Bottom status */}
      <div style={{
        padding: '0.75rem',
        borderTop: 'var(--border-brutal)',
        background: 'var(--color-surface)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: turn === 'listening' ? '3px solid var(--color-turquesa)' : 'var(--border-brutal)',
          background: turn === 'listening' ? 'rgba(46, 196, 182, 0.1)' : 'var(--color-surface)',
          animation: turn === 'listening' ? 'mic-pulse 1.5s infinite' : 'none',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={turn === 'listening' ? 'var(--color-turquesa)' : 'var(--color-text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="1" width="6" height="12" rx="3" fill={turn === 'listening' ? 'currentColor' : 'none'} />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" y1="18" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: turn === 'listening' ? 'var(--color-turquesa)' : 'var(--color-text-secondary)',
          }}>
            {turn === 'listening' ? 'Mic Active' : turn === 'processing' ? 'Processing...' : turn === 'speaking' ? 'AI Speaking...' : 'Idle'}
          </span>
        </div>
      </div>

      <VoiceMic
        active={turn === 'listening'}
        onFinalTranscript={onFinalTranscript}
        onInterimTranscript={onInterimTranscript}
      />

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(46, 196, 182, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(46, 196, 182, 0); }
        }
        @keyframes mic-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function VoicePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <>
      <AppNav />
      {sessionId ? (
        <ConversationScreen sessionId={sessionId} />
      ) : (
        <SetupScreen onStart={setSessionId} />
      )}
    </>
  );
}
