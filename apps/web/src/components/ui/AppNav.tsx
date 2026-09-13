'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/practice', label: 'Practice' },
  { href: '/translate', label: 'Translate' },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header
      style={{ borderBottom: 'var(--border-brutal-thick)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/dashboard" className="brutal-heading" style={{ fontSize: '1.25rem', textDecoration: 'none', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
          Convers<span style={{ color: 'var(--color-primary)' }}>IA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="items-center gap-2" style={{ display: 'none' }} data-desktop-nav>
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
          <button
            onClick={handleLogout}
            className="px-3 py-1.5"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2px solid var(--color-red)',
              background: 'transparent',
              color: 'var(--color-red)',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </nav>

        {/* Mobile: home + hamburger */}
        <div className="flex items-center gap-2" data-mobile-nav>
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid var(--color-border)',
              background: pathname === '/dashboard' ? 'var(--color-border)' : 'transparent',
              color: pathname === '/dashboard' ? 'var(--color-bg)' : 'var(--color-text)',
              textDecoration: 'none',
            }}
            aria-label="Menu principal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center"
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid var(--color-border)',
              background: menuOpen ? 'var(--color-border)' : 'transparent',
              color: menuOpen ? 'var(--color-bg)' : 'var(--color-text)',
              cursor: 'pointer',
            }}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="flex flex-col gap-1 px-4 pb-3"
          style={{ borderTop: '2px solid var(--color-border)' }}
          data-mobile-dropdown
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '2px solid var(--color-border)',
                  background: active ? 'var(--color-border)' : 'transparent',
                  color: active ? 'var(--color-bg)' : 'var(--color-text)',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-left"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2px solid var(--color-red)',
              background: 'transparent',
              color: 'var(--color-red)',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
            }}
          >
            Cerrar Sesion
          </button>
        </div>
      )}
    </header>
  );
}
