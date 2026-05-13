/**
 * @module usersStore
 * @description Gestión del estado global para el personal del restaurante.
 */
import { create } from 'zustand';
import { apiClient } from '../../../core/api/apiClient';

import type { User } from '../types';

type UserCreatePayload = Omit<User, 'id' | 'activo'> & { password: string };
type UserUpdatePayload = Partial<Pick<User, 'nombre' | 'email' | 'rol' | 'activo'>>;

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  createUser: (data: UserCreatePayload) => Promise<void>;
  updateUser: (id: number, data: UserUpdatePayload) => Promise<void>;
  resetPassword: (id: number, nueva: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.get<User[]>('/usuarios/');
      set({ users: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al cargar personal', isLoading: false });
    }
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/usuarios/', data);
      await get().fetchUsers(); // Recargar lista
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al crear usuario', isLoading: false });
      throw err;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/usuarios/${id}`, data);
      await get().fetchUsers();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al actualizar usuario', isLoading: false });
      throw err;
    }
  },

  resetPassword: async (id, nueva) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/usuarios/${id}/password`, { nueva_password: nueva });
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al resetear password', isLoading: false });
      throw err;
    }
  }
}));
