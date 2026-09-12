'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Credenciales inválidas / Invalid credentials');
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="brutal-heading inline-block mb-6"
            style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--color-text)' }}
          >
            Convers<span style={{ color: 'var(--color-primary)' }}>IA</span>
          </Link>

          <form onSubmit={handleSubmit} className="brutal-card p-8">
            <div className="mb-6">
              <h1 className="brutal-heading" style={{ fontSize: '2rem' }}>
                Login
              </h1>
              <p className="mt-2" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            {error && (
              <div
                className="mb-5 p-3 font-semibold text-sm"
                style={{
                  background: 'var(--color-red)',
                  color: '#fff',
                  border: 'var(--border-brutal)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                }}
              >
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="brutal-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="brutal-input"
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="brutal-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="brutal-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="brutal-btn brutal-btn-primary w-full">
              Entrar
            </button>

            <p className="mt-5 text-center" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-bold underline"
                style={{ color: 'var(--color-primary)', textUnderlineOffset: '3px' }}
              >
                Regístrate gratis
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
