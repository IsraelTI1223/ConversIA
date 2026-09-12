import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: {
    cefrLevel: string;
    totalPoints: number;
    streakDays: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    cefrLevel: string;
  }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

function persistTokens(accessToken: string, refreshToken: string) {
  try {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
  } catch {}
}

function clearTokens() {
  try {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  } catch {}
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
    );
    api.setToken(res.accessToken);
    persistTokens(res.accessToken, res.refreshToken);
    try { sessionStorage.setItem('user', JSON.stringify(res.user)); } catch {}
    set({ user: res.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      data,
    );
    api.setToken(res.accessToken);
    persistTokens(res.accessToken, res.refreshToken);
    try { sessionStorage.setItem('user', JSON.stringify(res.user)); } catch {}
    set({ user: res.user, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: () => {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      const userJson = sessionStorage.getItem('user');
      if (accessToken && userJson) {
        api.setToken(accessToken);
        set({ user: JSON.parse(userJson), isAuthenticated: true });
      }
    } catch {}
  },
}));
