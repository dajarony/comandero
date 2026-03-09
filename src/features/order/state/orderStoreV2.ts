// src/features/order/state/orderStoreV2.ts
import { create } from 'zustand';
import type { LineaPedidoV2, MenuItemV2, ModificadorSeleccionado } from '../types/OrderTypesV2';

function calcularPrecioLinea(item: MenuItemV2, mods: ModificadorSeleccionado[]): number {
  const extrasTotal = mods.reduce((acc, m) => acc + m.precioExtra, 0);
  return item.precio + extrasTotal;
}

interface OrderStateV2 {
  carritoPorMesa: Record<string, LineaPedidoV2[]>;
  addLineaV2: (mesaId: string, item: MenuItemV2, mods: ModificadorSeleccionado[], nota: string) => void;
  removeLineaV2: (mesaId: string, lineaIdx: number) => void;
  clearCarritoV2: (mesaId: string) => void;
  getCarritoV2: (mesaId: string) => LineaPedidoV2[];
  getTotalV2: (mesaId: string) => number;
  getTotalItemsV2: (mesaId: string) => number;
}

export const useOrderStoreV2 = create<OrderStateV2>((set, get) => ({
  carritoPorMesa: {},

  addLineaV2: (mesaId, item, mods, nota) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const precioUnitario = calcularPrecioLinea(item, mods);
    const nuevaLinea: LineaPedidoV2 = { item, cantidad: 1, nota, modificadores: mods, precioUnitario };
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [...carrito, nuevaLinea] } };
  }),

  removeLineaV2: (mesaId, lineaIdx) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: carrito.filter((_, i) => i !== lineaIdx) } };
  }),

  clearCarritoV2: (mesaId) => set(state => ({
    carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [] },
  })),

  getCarritoV2: (mesaId) => get().carritoPorMesa[mesaId] ?? [],

  getTotalV2: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  },

  getTotalItemsV2: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.cantidad, 0);
  },
}));
