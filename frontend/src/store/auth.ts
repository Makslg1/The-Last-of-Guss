import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.login(username, password);
      set({
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role as User['role'],
        },
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    set({ user: null, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const result = await api.getMe();
      set({
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role as User['role'],
        },
        isLoading: false,
      });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
