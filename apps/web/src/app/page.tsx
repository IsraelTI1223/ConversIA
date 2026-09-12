import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Marquee strip */}
      <div className="marquee-strip">
        <span>
          ENGLISH &bull; ESPAÑOL &bull; AI-POWERED &bull; CEFR A1-C2 &bull; CHAT &bull; PRACTICE &bull; TRANSLATE &bull; VOCABULARY &bull; ENGLISH &bull; ESPAÑOL &bull; AI-POWERED &bull; CEFR A1-C2 &bull; CHAT &bull; PRACTICE &bull; TRANSLATE &bull; VOCABULARY &bull;&nbsp;
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {/* Logo / Hero */}
          <div className="mb-8">
            <div
              className="inline-block px-4 py-2 mb-4"
              style={{
                background: 'var(--color-yellow)',
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                color: '#1A1A2E',
              }}
            >
              Beta v1.0
            </div>

            <h1
              className="brutal-heading"
              style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '0.5rem' }}
            >
              Convers
              <span style={{ color: 'var(--color-primary)' }}>IA</span>
            </h1>

            <p style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              maxWidth: '28ch',
              lineHeight: 1.4,
            }}>
              Aprende inglés conversando con inteligencia artificial.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: 'Chat 1:1', bg: 'var(--color-primary)', color: '#fff' },
              { label: 'Writing', bg: 'var(--color-turquesa)', color: '#1A1A2E' },
              { label: 'Speaking', bg: 'var(--color-yellow)', color: '#1A1A2E' },
              { label: 'Reading', bg: 'var(--color-secondary)', color: '#fff' },
              { label: 'Listening', bg: 'var(--color-pink)', color: '#1A1A2E' },
              { label: 'Translation', bg: 'var(--color-lime)', color: '#1A1A2E' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="brutal-badge"
                style={{ background: chip.bg, color: chip.color }}
              >
                {chip.label}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="brutal-btn brutal-btn-primary flex-1 text-center">
              Comenzar Gratis
            </Link>
            <Link href="/login" className="brutal-btn brutal-btn-secondary flex-1 text-center">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Info cards row */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { number: '6', label: 'Niveles CEFR', bg: 'var(--color-surface)' },
              { number: '∞', label: 'Conversaciones', bg: 'var(--color-surface)' },
              { number: '4', label: 'Habilidades', bg: 'var(--color-surface)' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 text-center"
                style={{
                  background: stat.bg,
                  border: 'var(--border-brutal)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                }}
              >
                <span className="brutal-heading block" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>
                  {stat.number}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-secondary)',
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="marquee-strip">
        <span>
          LEARN BY DOING &bull; APRENDE HACIENDO &bull; POWERED BY CLAUDE AI &bull; VOCABULARIO INTELIGENTE &bull; CORRECCIÓN EN TIEMPO REAL &bull; LEARN BY DOING &bull; APRENDE HACIENDO &bull; POWERED BY CLAUDE AI &bull; VOCABULARIO INTELIGENTE &bull; CORRECCIÓN EN TIEMPO REAL &bull;&nbsp;
        </span>
      </div>
    </main>
  );
}
