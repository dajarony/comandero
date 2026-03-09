import { create } from 'zustand';
import type { LineaPedido, MenuItem } from '../types/OrderTypes';

interface OrderState {
  carritoPorMesa: Record<string, LineaPedido[]>;
  addItem: (mesaId: string, item: MenuItem) => void;
  removeItem: (mesaId: string, itemId: string) => void;
  clearCarrito: (mesaId: string) => void;
  getCarrito: (mesaId: string) => LineaPedido[];
  getTotal: (mesaId: string) => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  carritoPorMesa: {},

  addItem: (mesaId, item) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const existente = carrito.find(l => l.item.id === item.id);
    const nuevoCarrito = existente
      ? carrito.map(l => l.item.id === item.id ? { ...l, cantidad: l.cantidad + 1 } : l)
      : [...carrito, { item, cantidad: 1, nota: '' }];
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: nuevoCarrito } };
  }),

  removeItem: (mesaId, itemId) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const nuevoCarrito = carrito
      .map(l => l.item.id === itemId ? { ...l, cantidad: l.cantidad - 1 } : l)
      .filter(l => l.cantidad > 0);
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: nuevoCarrito } };
  }),

  clearCarrito: (mesaId) => set(state => ({
    carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [] },
  })),

  getCarrito: (mesaId) => get().carritoPorMesa[mesaId] ?? [],

  getTotal: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.item.precio * l.cantidad, 0);
  },
}));
