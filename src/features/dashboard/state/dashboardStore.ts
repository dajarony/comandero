/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/state/dashboardStore.ts
 * Tipo: Estado Global → Estadisticas del Dia
 * Lineas: ~30 / 200 MAX
 *
 * Acciones:
 * - Almacena StatsHoy, loading, error
 *
 * Ultima Modificacion: 2026-03-15 | Dajarony
 * Cambio: Tipado real con StatsHoy.
 * ===============================================================
 */

import { create } from 'zustand';
import type { StatsHoy } from '../types/DashboardTypes';

interface DashboardState {
  stats: StatsHoy | null;
  loading: boolean;
  error: string | null;
  setStats: (stats: StatsHoy) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  setStats: (stats) => set({ stats, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clear: () => set({ stats: null, loading: false, error: null }),
}));
