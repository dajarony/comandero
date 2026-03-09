import { create } from 'zustand';

interface AuthState {
  data: any | null;
  setData: (data: any) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null })
}));
