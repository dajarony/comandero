/**
 * @module statsStore
 * @description Estado global para el módulo de reportes y estadísticas.
 */
import { create } from 'zustand';
import { apiClient } from '@/core/api/apiClient';

export interface StatsData {
  ventas_total: number;
  pedidos_count: number;
  mesas_atendidas: number;
  ticket_medio: number;
  top_items: Array<{
    nombre: string;
    emoji: string;
    cantidad: number;
    total: number;
  }>;
  ventas_por_categoria: Array<{
    nombre: string;
    total: number;
  }>;
  ventas_por_hora: Array<{
    hora: string;
    total: number;
  }>;
}

interface StatsState {
  stats: StatsData | null;
  periodo: 'hoy' | 'semana' | 'mes';
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setPeriodo: (p: 'hoy' | 'semana' | 'mes') => void;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  periodo: 'hoy',
  isLoading: false,
  error: null,

  setPeriodo: (periodo) => {
    set({ periodo });
    get().fetchStats();
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      // apiClient.get ya desenvuelve el .data y lanza Error si !response.ok
      const data = await apiClient.get<StatsData>(`/stats/resumen?periodo=${get().periodo}`);
      set({ stats: data });
    } catch (err) {
      console.error('Stats Fetch Error:', err);
      set({ error: err instanceof Error ? err.message : 'Fallo de conexión con el servidor' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
