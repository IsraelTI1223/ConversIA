'use client';

import Link from 'next/link';
import { AppNav } from '@/components/ui/AppNav';

const SKILLS = [
  { href: '/chat', label: 'Chat', desc: 'Conversa 1:1 con IA', bg: 'var(--color-primary)', icon: '💬' },
  { href: '/practice', label: 'Practice', desc: 'Ejercicios con tu vocabulario', bg: 'var(--color-turquesa)', icon: '🏋️' },
  { href: '/translate', label: 'Translate', desc: 'Traduce con tips inteligentes', bg: 'var(--color-secondary)', icon: '🌐' },
];

const STATS = [
  { label: 'Nivel', value: 'A1', bg: 'var(--color-primary)', color: '#fff' },
  { label: 'Puntos', value: '0', bg: 'var(--color-yellow)', color: '#1A1A2E' },
  { label: 'Racha', value: '0d', bg: 'var(--color-turquesa)', color: '#1A1A2E' },
  { label: 'Vocab', value: '0', bg: 'var(--color-lime)', color: '#1A1A2E' },
];

const SKILL_BARS = [
  { skill: 'Writing', pct: 0, color: 'var(--color-primary)' },
  { skill: 'Speaking', pct: 0, color: 'var(--color-turquesa)' },
  { skill: 'Reading', pct: 0, color: 'var(--color-secondary)' },
  { skill: 'Listening', pct: 0, color: 'var(--color-yellow)' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppNav />

      <div className="max-w-5xl mx-auto p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="brutal-heading" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            Dashboard
          </h2>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
            Tu progreso de aprendizaje
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STATS.map((stat) => (
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
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {SKILLS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="brutal-card block p-6"
              style={{ textDecoration: 'none', color: 'var(--color-text)' }}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
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
            {SKILL_BARS.map((bar) => (
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
      </div>
    </div>
  );
}
