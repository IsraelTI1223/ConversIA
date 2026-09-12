'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/practice', label: 'Practice' },
  { href: '/translate', label: 'Translate' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: 'var(--border-brutal-thick)', background: 'var(--color-surface)' }}
    >
      <Link href="/dashboard" className="brutal-heading" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
        Convers<span style={{ color: 'var(--color-primary)' }}>IA</span>
      </Link>
      <nav className="flex gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '2px solid var(--color-border)',
                background: active ? 'var(--color-border)' : 'transparent',
                color: active ? 'var(--color-bg)' : 'var(--color-text)',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
