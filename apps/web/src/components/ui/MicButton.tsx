'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MicButton({
  onTranscript,
  lang = 'en-US',
  compact = false,
  timed = false,
  maxSeconds = 300,
}: {
  onTranscript: (text: string) => void;
  lang?: string;
  compact?: boolean;
  timed?: boolean;
  maxSeconds?: number;
}) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!getSpeechRecognition()) setSupported(false);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    if (recording) {
      stopRecording();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = timed;
    recognition.interimResults = false;

    if (timed) {
      transcriptRef.current = '';
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (timed) {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + text.trim();
        onTranscript(transcriptRef.current);
      } else {
        const text = event.results[0][0].transcript.trim();
        if (text) onTranscript(text);
      }
    };

    recognition.onerror = () => {
      setRecording(false);
      recognitionRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    setRecording(true);
    setSecondsLeft(maxSeconds);
    recognition.start();

    if (timed) {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = maxSeconds - elapsed;
        if (remaining <= 0) {
          setSecondsLeft(0);
          recognition.stop();
          clearInterval(timerRef.current!);
          timerRef.current = null;
        } else {
          setSecondsLeft(remaining);
        }
      }, 1000);
    }
  }, [recording, lang, onTranscript, timed, maxSeconds, stopRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!supported) return null;

  const size = compact ? 16 : 22;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={toggle}
        title={recording ? 'Detener grabación' : 'Hablar'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: compact ? '2rem' : '2.75rem',
          height: compact ? '2rem' : '2.75rem',
          border: recording ? '3px solid var(--color-red)' : 'var(--border-brutal)',
          background: recording ? 'var(--color-red)' : 'var(--color-surface)',
          color: recording ? '#fff' : 'var(--color-text)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          flexShrink: 0,
          animation: recording ? 'mic-pulse 1.5s infinite' : 'none',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="1" width="6" height="12" rx="3" fill={recording ? 'currentColor' : 'none'} />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="18" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {timed && recording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          border: 'var(--border-brutal)',
          background: 'var(--color-surface)',
          padding: '0.25rem 0.625rem',
        }}>
          <span style={{
            width: '0.5rem',
            height: '0.5rem',
            background: 'var(--color-red)',
            borderRadius: '50%',
            animation: 'mic-blink 1s infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: secondsLeft <= 30 ? 'var(--color-red)' : 'var(--color-text)',
            minWidth: '2.5rem',
            textAlign: 'center',
          }}>
            {formatTime(secondsLeft)}
          </span>
          <div style={{
            width: '4rem',
            height: '0.375rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-text-secondary)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(secondsLeft / maxSeconds) * 100}%`,
              background: secondsLeft <= 30 ? 'var(--color-red)' : 'var(--color-lime)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
        }
        @keyframes mic-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
