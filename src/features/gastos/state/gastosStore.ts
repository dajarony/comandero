/**
 * @module gastosStore
 * @description Estado global Zustand para el módulo de Gastos del Negocio.
 * SUME Docblock v2.0
 * Entradas : acciones del usuario (crearGasto, eliminarGasto, fetchGastos)
 * Lógica   : Zustand store con llamadas a gastosApi, gestión de loading/error
 * Salidas  : estado reactivo { gastos, resumen, isLoading, error } + acciones
 */

import { create } from 'zustand';
import type { Gasto, GastoForm, GastosResumen } from '../types';
import * as api from '../api/gastosApi';

interface GastosState {
  gastos: Gasto[];
  resumen: GastosResumen | null;
  isLoading: boolean;
  error: string | null;

  fetchGastos: () => Promise<void>;
  fetchResumen: () => Promise<void>;
  crearGasto: (data: GastoForm) => Promise<void>;
  eliminarGasto: (id: number) => Promise<void>;
}

export const useGastosStore = create<GastosState>((set, get) => ({
  gastos: [],
  resumen: null,
  isLoading: false,
  error: null,

  fetchGastos: async () => {
    set({ isLoading: true, error: null });
    try {
      const [gastos, resumen] = await Promise.all([
        api.fetchGastos(),
        api.fetchResumen(),
      ]);
      set({ gastos, resumen });
    } catch (err) {
      console.error('GastosStore fetchGastos error:', err);
      set({ error: err instanceof Error ? err.message : 'Error al cargar gastos' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchResumen: async () => {
    try {
      const resumen = await api.fetchResumen();
      set({ resumen });
    } catch (err) {
      console.error('GastosStore fetchResumen error:', err);
    }
  },

  crearGasto: async (data: GastoForm) => {
    set({ isLoading: true, error: null });
    try {
      await api.crearGasto(data);
      await get().fetchGastos();
    } catch (err) {
      console.error('GastosStore crearGasto error:', err);
      set({ error: err instanceof Error ? err.message : 'Error al crear gasto' });
    } finally {
      set({ isLoading: false });
    }
  },

  eliminarGasto: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.eliminarGasto(id);
      set(state => ({ gastos: state.gastos.filter(g => g.id !== id) }));
      await get().fetchResumen();
    } catch (err) {
      console.error('GastosStore eliminarGasto error:', err);
      set({ error: err instanceof Error ? err.message : 'Error al eliminar gasto' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
