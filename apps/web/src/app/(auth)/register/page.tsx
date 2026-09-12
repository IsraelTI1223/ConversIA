'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

const CEFR_LEVELS = [
  { id: 'A1', label: 'Beginner', color: 'var(--color-lime)' },
  { id: 'A2', label: 'Elementary', color: 'var(--color-turquesa)' },
  { id: 'B1', label: 'Intermediate', color: 'var(--color-yellow)' },
  { id: 'B2', label: 'Upper Inter.', color: 'var(--color-primary)' },
  { id: 'C1', label: 'Advanced', color: 'var(--color-secondary)' },
  { id: 'C2', label: 'Mastery', color: 'var(--color-red)' },
] as const;

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    cefrLevel: 'A1',
  });
  const router = useRouter();
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      router.push('/dashboard');
    } catch {
      setError('Error al registrarse / Registration failed');
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
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
                Registro
              </h1>
              <p className="mt-2" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Crea tu cuenta y empieza a practicar hoy
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

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="brutal-label">Nombre</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={update('firstName')}
                  required
                  className="brutal-input"
                  placeholder="María"
                />
              </div>
              <div>
                <label className="brutal-label">Apellido</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={update('lastName')}
                  required
                  className="brutal-input"
                  placeholder="García"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="brutal-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                className="brutal-input"
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="brutal-label">Password (mín. 8 caracteres)</label>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
                className="brutal-input"
                placeholder="••••••••"
              />
            </div>

            <div className="mb-7">
              <label className="brutal-label">¿Cuál es tu nivel de inglés?</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CEFR_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, cefrLevel: level.id }))}
                    className="p-2 text-center cursor-pointer transition-transform"
                    style={{
                      border: 'var(--border-brutal)',
                      boxShadow: form.cefrLevel === level.id ? 'var(--shadow-brutal)' : 'var(--shadow-brutal-sm)',
                      background: form.cefrLevel === level.id ? level.color : 'var(--color-bg)',
                      color: form.cefrLevel === level.id ? '#1A1A2E' : 'var(--color-text)',
                      transform: form.cefrLevel === level.id ? 'translate(-2px, -2px)' : 'none',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {level.id}
                    <span
                      className="block"
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 500,
                        opacity: form.cefrLevel === level.id ? 0.8 : 0.5,
                        marginTop: '2px',
                      }}
                    >
                      {level.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="brutal-btn brutal-btn-primary w-full">
              Crear Cuenta
            </button>

            <p className="mt-5 text-center" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="font-bold underline"
                style={{ color: 'var(--color-primary)', textUnderlineOffset: '3px' }}
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
