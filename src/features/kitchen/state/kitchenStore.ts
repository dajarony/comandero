/**
 * @module kitchenStore
 * @description Estado global para el Kitchen Display System (KDS)
 */
import { create } from 'zustand';
import type { PedidoApi } from '@/features/order/api/orderApi';
import { apiClient } from '@/core/api/apiClient';
import toast from 'react-hot-toast';

let kitchenRevision = 0;

interface KitchenState {
  orders: PedidoApi[];
  isLoading: boolean;
  isConnected: boolean;
  
  // Acciones
  fetchActiveOrders: () => Promise<void>;
  addOrder: (order: PedidoApi) => void;
  removeOrder: (orderId: number) => void;
  removeTable: (tableId: number) => void;
  setConnected: (status: boolean) => void;
  markAsReady: (orderId: number) => Promise<void>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  orders: [],
  isLoading: false,
  isConnected: false,

  fetchActiveOrders: async () => {
    const revision = kitchenRevision;
    set({ isLoading: true });
    try {
      // Endpoint que creamos en el backend
      const res = await apiClient.get<PedidoApi[]>('/pedidos/cocina/pendientes');
      if (revision === kitchenRevision) set({ orders: res.filter(order => order.estado === 'MARCHADO') });
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addOrder: (order) => {
    kitchenRevision++;
    set((state) => {
      // Evitar duplicados
      if (state.orders.some(o => o.id === order.id)) return state;
      return { orders: [...state.orders, order] };
    });
  },

  removeOrder: (orderId) => {
    kitchenRevision++;
    set((state) => ({
      orders: state.orders.filter(o => o.id !== orderId)
    }));
  },

  removeTable: (tableId) => {
    kitchenRevision++;
    set(state => ({ orders: state.orders.filter(order => order.mesa_id !== tableId) }));
  },

  setConnected: (status) => set({ isConnected: status }),

  markAsReady: async (orderId) => {
    try {
      await apiClient.put(`/pedidos/${orderId}/completar`, undefined, false);
      get().removeOrder(orderId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo marcar la comanda como lista.');
    }
  }
}));
