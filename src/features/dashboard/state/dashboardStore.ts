import { create } from 'zustand';

interface DashboardState {
  data: any | null;
  setData: (data: any) => void;
  clear: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null })
}));
