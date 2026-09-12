'use client';

import { useState, useCallback, useRef } from 'react';

const SPEEDS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

export function SpeakButton({
  text,
  lang = 'en-US',
  compact = false,
}: {
  text: string;
  lang?: string;
  compact?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [showSpeeds, setShowSpeeds] = useState(false);
  const [rate, setRate] = useState(1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utterRef.current = utter;

    window.speechSynthesis.cancel();
    setPlaying(true);
    window.speechSynthesis.speak(utter);
  }, [text, lang, rate, playing]);

  const changeRate = (newRate: number) => {
    setRate(newRate);
    setShowSpeeds(false);
    if (playing) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = newRate;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }}>
      <button
        type="button"
        onClick={speak}
        title={playing ? 'Stop' : 'Listen'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: compact ? '0.125rem' : '0.25rem',
          fontSize: compact ? '0.85rem' : '1rem',
          lineHeight: 1,
          opacity: playing ? 1 : 0.7,
          transition: 'opacity 0.15s',
          color: 'inherit',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = playing ? '1' : '0.7')}
      >
        {playing ? (
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowSpeeds(!showSpeeds)}
        title="Playback speed"
        style={{
          background: 'none',
          border: '1.5px solid currentColor',
          cursor: 'pointer',
          padding: '0 0.25rem',
          fontSize: compact ? '0.55rem' : '0.6rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          lineHeight: compact ? '1.1rem' : '1.25rem',
          opacity: 0.6,
          color: 'inherit',
          minWidth: compact ? '1.75rem' : '2rem',
          textAlign: 'center',
        }}
      >
        {rate}x
      </button>

      {showSpeeds && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '0.25rem',
            border: 'var(--border-brutal)',
            boxShadow: 'var(--shadow-brutal-sm)',
            background: 'var(--color-surface)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => changeRate(s.value)}
              style={{
                background: rate === s.value ? 'var(--color-primary)' : 'transparent',
                color: rate === s.value ? '#fff' : 'var(--color-text)',
                border: 'none',
                borderBottom: '1px solid var(--color-text-secondary)',
                padding: '0.375rem 0.75rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              {s.label} {s.value < 0.8 ? 'Slow' : s.value > 1.2 ? 'Fast' : s.value === 1 ? 'Normal' : ''}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
