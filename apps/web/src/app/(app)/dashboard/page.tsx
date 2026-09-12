'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/ui/AppNav';
import { api } from '@/lib/api';

interface Stats {
  cefrLevel: string;
  totalPoints: number;
  dailyPoints: number;
  streakDays: number;
  vocabularyCount: number;
  completedSessions: number;
  skills: {
    writing: number;
    speaking: number;
    reading: number;
    listening: number;
  };
}

function IconChat() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconPractice() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconTranslate() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const SKILLS_NAV = [
  { href: '/chat', label: 'Chat', desc: 'Conversa 1:1 con IA', bg: 'var(--color-primary)', Icon: IconChat },
  { href: '/practice', label: 'Practice', desc: 'Ejercicios con tu vocabulario', bg: 'var(--color-turquesa)', Icon: IconPractice },
  { href: '/translate', label: 'Translate', desc: 'Traduce con tips inteligentes', bg: 'var(--color-secondary)', Icon: IconTranslate },
];

const SKILL_COLORS: Record<string, string> = {
  writing: 'var(--color-primary)',
  speaking: 'var(--color-turquesa)',
  reading: 'var(--color-secondary)',
  listening: 'var(--color-yellow)',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Stats>('/users/stats')
      .then(setStats)
      .catch(() => setError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Nivel', value: stats.cefrLevel, bg: 'var(--color-primary)', color: '#fff' },
    { label: 'Hoy', value: String(stats.dailyPoints), bg: 'var(--color-yellow)', color: '#1A1A2E', sub: 'pts' },
    { label: 'Total', value: String(stats.totalPoints), bg: 'var(--color-turquesa)', color: '#1A1A2E', sub: 'pts' },
    { label: 'Racha', value: `${stats.streakDays}`, bg: 'var(--color-lime)', color: '#1A1A2E', sub: 'días' },
  ] : [];

  const skillBars = stats ? [
    { skill: 'Writing', pct: stats.skills.writing, color: SKILL_COLORS.writing },
    { skill: 'Speaking', pct: stats.skills.speaking, color: SKILL_COLORS.speaking },
    { skill: 'Reading', pct: stats.skills.reading, color: SKILL_COLORS.reading },
    { skill: 'Listening', pct: stats.skills.listening, color: SKILL_COLORS.listening },
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppNav />

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="brutal-heading" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            Dashboard
          </h2>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
            Tu progreso de aprendizaje
          </p>
        </div>

        {error && (
          <div style={{
            border: '3px solid var(--color-red)',
            background: 'rgba(255, 107, 107, 0.15)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--color-red)',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
          }}>
            Cargando estadísticas...
          </div>
        ) : stats && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="p-5"
                  style={{
                    background: stat.bg,
                    color: stat.color,
                    border: 'var(--border-brutal-thick)',
                    boxShadow: 'var(--shadow-brutal)',
                  }}
                >
                  <span
                    className="block mb-1"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.12em',
                      opacity: 0.7,
                    }}
                  >
                    {stat.label}
                  </span>
                  <span className="brutal-heading block" style={{ fontSize: '2.5rem' }}>
                    {stat.value}
                  </span>
                  {'sub' in stat && stat.sub && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      opacity: 0.6,
                    }}>
                      {stat.sub}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {SKILLS_NAV.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="brutal-card block p-6"
                  style={{ textDecoration: 'none', color: 'var(--color-text)' }}
                >
                  <div className="mb-3" style={{ color: action.bg }}><action.Icon /></div>
                  <div
                    className="brutal-heading text-xl mb-2"
                    style={{ color: action.bg }}
                  >
                    {action.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    {action.desc}
                  </div>

                  <div
                    className="px-3 py-1.5 inline-block"
                    style={{
                      background: action.bg,
                      color: action.bg === 'var(--color-secondary)' ? '#fff' : '#1A1A2E',
                      border: 'var(--border-brutal)',
                      boxShadow: 'var(--shadow-brutal-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                    }}
                  >
                    Ir →
                  </div>
                </Link>
              ))}
            </div>

            {/* Skills Progress */}
            <div className="brutal-card p-6">
              <h3 className="brutal-heading mb-4" style={{ fontSize: '1.25rem' }}>
                Progreso por Habilidad
              </h3>
              <div className="flex flex-col gap-3">
                {skillBars.map((bar) => (
                  <div key={bar.skill} className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        width: '5.5rem',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {bar.skill}
                    </span>
                    <div
                      className="flex-1 h-6"
                      style={{ background: 'var(--color-surface-alt)', border: '2px solid var(--color-border)' }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${bar.pct}%`,
                          background: bar.color,
                          minWidth: bar.pct > 0 ? '8px' : '0',
                          transition: 'width 0.6s ease-out',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        width: '2.5rem',
                        textAlign: 'right' as const,
                      }}
                    >
                      {bar.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions count */}
            {stats.completedSessions > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                border: 'var(--border-brutal)',
                background: 'var(--color-surface)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
              }}>
                {stats.completedSessions} {stats.completedSessions === 1 ? 'sesión' : 'sesiones'} de chat {stats.completedSessions === 1 ? 'completada' : 'completadas'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
