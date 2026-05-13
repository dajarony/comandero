/**
 * @module kitchenStore
 * @description Estado global para el Kitchen Display System (KDS)
 */
import { create } from 'zustand';
import type { PedidoApi } from '@/features/order/api/orderApi';
import { apiClient } from '@/core/api/apiClient';

interface KitchenState {
  orders: PedidoApi[];
  isLoading: boolean;
  isConnected: boolean;
  
  // Acciones
  fetchActiveOrders: () => Promise<void>;
  addOrder: (order: PedidoApi) => void;
  removeOrder: (orderId: number) => void;
  setConnected: (status: boolean) => void;
  markAsReady: (orderId: number) => Promise<void>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  orders: [],
  isLoading: false,
  isConnected: false,

  fetchActiveOrders: async () => {
    set({ isLoading: true });
    try {
      // Endpoint que creamos en el backend
      const res = await apiClient.get<PedidoApi[]>('/pedidos/cocina/pendientes');
      set({ orders: res, isLoading: false });
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      set({ isLoading: false });
    }
  },

  addOrder: (order) => {
    set((state) => {
      // Evitar duplicados
      if (state.orders.some(o => o.id === order.id)) return state;
      return { orders: [...state.orders, order] };
    });
  },

  removeOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.filter(o => o.id !== orderId)
    }));
  },

  setConnected: (status) => set({ isConnected: status }),

  markAsReady: async (orderId) => {
    try {
      await apiClient.put(`/pedidos/${orderId}/completar`);
      get().removeOrder(orderId);
    } catch (err) {
      console.error('Error marking order as ready:', err);
    }
  }
}));
