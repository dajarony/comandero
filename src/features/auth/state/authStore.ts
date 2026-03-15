/**
 * Auth Store — Zustand + localStorage para persistir sesión
 */
import { create } from 'zustand';
import type { UsuarioResponse } from '../types/AuthTypes';

const TOKEN_KEY = 'comandero_token';
const USER_KEY = 'comandero_user';

interface AuthState {
  token: string | null;
  usuario: UsuarioResponse | null;
  isAuthenticated: boolean;

  /** Guarda token + usuario tras login exitoso */
  setSession: (token: string, usuario: UsuarioResponse) => void;

  /** Limpia sesión (logout) */
  logout: () => void;

  /** Carga sesión existente desde localStorage */
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  usuario: null,
  isAuthenticated: false,

  setSession: (token, usuario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    set({ token, usuario, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, usuario: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const usuario = JSON.parse(userStr) as UsuarioResponse;
        set({ token, usuario, isAuthenticated: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },
}));
