'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/ui/AppNav';
import { useChat, ChatMessage, VocabWord } from '@/hooks/useChat';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { MicButton } from '@/components/ui/MicButton';
import { api } from '@/lib/api';

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  'daily-life': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  'travel': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  'technology': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  'food': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  'work': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  'health': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  'entertainment': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>,
  'environment': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const content = msg.contentEn || msg.contentEs;
  const hasEnglish = !!msg.contentEn;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '0.75rem' }}>
      <div
        style={{
          maxWidth: '80%',
          border: 'var(--border-brutal)',
          boxShadow: 'var(--shadow-brutal-sm)',
          padding: '0.875rem 1rem',
          background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
          color: isUser ? '#fff' : 'var(--color-text)',
        }}
      >
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '0.375rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isUser ? 'Tú' : 'ConversIA'}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{content}</p>
          {hasEnglish && <SpeakButton text={msg.contentEn} />}
        </div>

        {!isUser && msg.contentEs && msg.contentEn && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7, fontStyle: 'italic' }}>
            {msg.contentEs}
          </p>
        )}

        {!isUser && msg.correctionEn && !msg.isCorrect && (
          <div
            style={{
              marginTop: '0.625rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 107, 107, 0.15)',
              border: '2px solid var(--color-red)',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-red)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                CORRECTION
              </span>
              <SpeakButton text={msg.correctionEn} compact />
            </div>
            <p style={{ marginTop: '0.25rem' }}>{msg.correctionEn}</p>
          </div>
        )}

        {!isUser && msg.vocabulary && msg.vocabulary.length > 0 && (
          <div style={{ marginTop: '0.625rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {msg.vocabulary.map((v, i) => (
              <VocabChip key={i} word={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VocabChip({ word }: { word: VocabWord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: '2px solid var(--color-lime)',
        background: expanded ? 'var(--color-lime)' : 'transparent',
        color: expanded ? '#1A1A2E' : 'var(--color-lime)',
        padding: '0.25rem 0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        fontWeight: 700,
        textAlign: 'left',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        {word.wordEn} → {word.wordEs}
        {word.phonetic && <span style={{ fontWeight: 400, marginLeft: '0.25rem' }}>{word.phonetic}</span>}
        {expanded && word.exampleEn && (
          <span style={{ display: 'block', fontWeight: 400, fontSize: '0.65rem', marginTop: '0.25rem' }}>
            "{word.exampleEn}"
          </span>
        )}
      </button>
      <SpeakButton text={word.wordEn} compact />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
      <div
        style={{
          border: 'var(--border-brutal)',
          boxShadow: 'var(--shadow-brutal-sm)',
          padding: '0.875rem 1.25rem',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                background: 'var(--color-primary)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: `typing-bounce 1.2s ${i * 0.2}s infinite`,
              }}
            />
          ))}
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginLeft: '0.5rem', color: 'var(--color-text-secondary)' }}>
            ConversIA is typing...
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatView({
  level,
  topic,
  sessionId,
  onEnd,
}: {
  level: string;
  topic: string;
  sessionId: string;
  onEnd: () => void;
}) {
  const { messages, isTyping, isConnected, error, sendMessage } = useChat(sessionId);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input, lang);
    setInput('');
  };

  const topicLabel = TOPICS.find((t) => t.id === topic)?.label ?? topic;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>

      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: 'var(--border-brutal-thick)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3">
          <span className="brutal-heading" style={{ fontSize: '1.25rem' }}>
            Convers<span style={{ color: 'var(--color-primary)' }}>IA</span>
          </span>
          <span className="brutal-badge" style={{ background: 'var(--color-turquesa)', color: '#1A1A2E' }}>
            {level}
          </span>
          <span className="brutal-badge" style={{ background: 'var(--color-yellow)', color: '#1A1A2E' }}>
            {topicLabel}
          </span>
          <span
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: isConnected ? 'var(--color-lime)' : 'var(--color-red)',
              display: 'inline-block',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onEnd}
          className="brutal-btn brutal-btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
        >
          Terminar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="text-4xl block mb-3">👋</span>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
              Start the conversation!
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Write in English to practice, or in Spanish if you need help.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        {error && (
          <div
            style={{
              margin: '0.5rem 0',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 107, 107, 0.15)',
              border: '2px solid var(--color-red)',
              fontSize: '0.8rem',
              color: 'var(--color-red)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className="px-6 py-4"
        style={{ borderTop: 'var(--border-brutal-thick)', background: 'var(--color-surface)' }}
      >
        <div className="flex gap-2 mb-2">
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              style={{
                padding: '0.25rem 0.75rem',
                border: '2px solid var(--color-text)',
                background: lang === l ? 'var(--color-primary)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {l === 'en' ? 'English' : 'Español'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={lang === 'en' ? 'Type or speak in English...' : 'Escribe o habla en español...'}
            disabled={!isConnected || isTyping}
            className="brutal-input flex-1"
            style={{ marginBottom: 0 }}
          />
          <MicButton
            onTranscript={(text) => setInput(text)}
            lang={lang === 'en' ? 'en-US' : 'es-ES'}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || isTyping}
            className="brutal-btn brutal-btn-primary disabled:opacity-40"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [level, setLevel] = useState('A1');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(15);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleStart = async () => {
    if (!topic || creating) return;
    setCreating(true);
    try {
      const session = await api.post<{ id: string }>('/chat/sessions', {
        cefrLevel: level,
        topic: TOPICS.find((t) => t.id === topic)?.label ?? topic,
        durationMinutes: duration,
      });
      setSessionId(session.id);
    } catch {
      alert('Error creating session. Make sure you are logged in.');
      router.push('/login');
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async () => {
    if (sessionId) {
      try {
        await api.patch(`/chat/sessions/${sessionId}/end`);
      } catch {}
    }
    setSessionId(null);
  };

  if (sessionId) {
    return <ChatView level={level} topic={topic} sessionId={sessionId} onEnd={handleEnd} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppNav />

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="brutal-heading mb-8" style={{ fontSize: '2.5rem' }}>
          Nueva
          <br />
          <span style={{ color: 'var(--color-primary)' }}>Conversación</span>
        </h1>

        <div className="brutal-card p-6 mb-4">
          <label className="brutal-label">Nivel CEFR</label>
          <div className="flex gap-2">
            {CEFR.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className="flex-1 py-3 cursor-pointer"
                style={{
                  border: 'var(--border-brutal)',
                  boxShadow: level === l ? 'var(--shadow-brutal)' : 'var(--shadow-brutal-sm)',
                  background: level === l ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: level === l ? '#fff' : 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  transform: level === l ? 'translate(-2px, -2px)' : 'none',
                  transition: 'all 0.1s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="brutal-card p-6 mb-4">
          <label className="brutal-label">Tema / Topic</label>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                className="flex items-center gap-2 p-3 text-left cursor-pointer"
                style={{
                  border: 'var(--border-brutal)',
                  boxShadow: topic === t.id ? 'var(--shadow-brutal)' : 'var(--shadow-brutal-sm)',
                  background: topic === t.id ? 'var(--color-turquesa)' : 'var(--color-bg)',
                  color: topic === t.id ? '#1A1A2E' : 'var(--color-text)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transform: topic === t.id ? 'translate(-2px, -2px)' : 'none',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{ opacity: 0.7 }}>{TOPIC_ICONS[t.id]}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="brutal-card p-6 mb-6">
          <label className="brutal-label">
            Duración:{' '}
            <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>{duration} min</span>
          </label>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full mt-2"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          <div className="flex justify-between mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
            <span>5 min</span>
            <span>60 min</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!topic || creating}
          className="brutal-btn brutal-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: '1.1rem', padding: '1.125rem' }}
        >
          {creating ? 'Creando sesión...' : topic ? 'Comenzar Chat' : 'Selecciona un tema'}
        </button>
      </div>
    </div>
  );
}
