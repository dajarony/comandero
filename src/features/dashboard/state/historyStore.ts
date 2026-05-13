/**
 * @module historyStore
 * @description Gestión del estado global para el historial de pedidos cerrados.
 */
import { create } from 'zustand';
import { apiClient } from '@/core/api/apiClient';
import type { PedidoApi } from '@/features/order/api/orderApi';

interface HistoryFilters {
  fecha_inicio?: string;
  usuario_id?: number | null;
}

interface HistoryState {
  pedidos: PedidoApi[];
  isLoading: boolean;
  error: string | null;
  filters: HistoryFilters;
  
  setFilters: (newFilters: HistoryFilters) => void;
  fetchHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  pedidos: [],
  isLoading: false,
  error: null,
  filters: {
    fecha_inicio: new Date().toISOString().split('T')[0], // Hoy por defecto
    usuario_id: null
  },

  setFilters: (newFilters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    }));
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.usuario_id) params.append('usuario_id', filters.usuario_id.toString());
      
      const queryString = params.toString();
      const url = `/pedidos/historial${queryString ? `?${queryString}` : ''}`;

      const data = await apiClient.get<PedidoApi[]>(url);
      set({ pedidos: data, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Error al cargar historial de pedidos', 
        isLoading: false 
      });
    }
  }
}));
