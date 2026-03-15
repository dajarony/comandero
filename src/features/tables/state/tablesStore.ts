/**
 * Tables Store — Estado de mesas en Zustand
 */
import { create } from 'zustand';
import type { Mesa, FiltroMesa } from '../types/TablesTypes';

interface TablesState {
  mesas: Mesa[];
  filtro: FiltroMesa;
  busqueda: string;
  loading: boolean;
  error: string | null;

  setMesas: (mesas: Mesa[]) => void;
  setFiltro: (filtro: FiltroMesa) => void;
  setBusqueda: (q: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  updateMesa: (mesa: Mesa) => void;
}

export const useTablesStore = create<TablesState>((set) => ({
  mesas: [],
  filtro: 'TODAS',
  busqueda: '',
  loading: false,
  error: null,

  setMesas: (mesas) => set({ mesas }),
  setFiltro: (filtro) => set({ filtro }),
  setBusqueda: (busqueda) => set({ busqueda }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateMesa: (mesa) =>
    set((state) => ({
      mesas: state.mesas.map((m) => (m.id === mesa.id ? mesa : m)),
    })),
}));
