import { create } from 'zustand';
import type { Mesa, MesaEstado } from '../types/TablesTypes';

const MESAS_INICIALES: Mesa[] = [
  { id: '01', estado: 'LIBRE' },
  { id: '02', estado: 'OCUPADA', totalCuenta: 45.50, horaApertura: '13:20', comensales: 3 },
  { id: '03', estado: 'LIBRE' },
  { id: '04', estado: 'PENDIENTE_COBRO', totalCuenta: 78.00, horaApertura: '12:45', comensales: 4 },
  { id: '05', estado: 'LIBRE' },
  { id: '06', estado: 'OCUPADA', totalCuenta: 23.00, horaApertura: '14:10', comensales: 2 },
  { id: '07', estado: 'LIBRE' },
  { id: '08', estado: 'OCUPADA', totalCuenta: 112.50, horaApertura: '12:00', comensales: 6 },
  { id: '09', estado: 'LIBRE' },
  { id: '10', estado: 'LIBRE' },
  { id: '11', estado: 'PENDIENTE_COBRO', totalCuenta: 56.75, horaApertura: '13:00', comensales: 3 },
  { id: '12', estado: 'OCUPADA', totalCuenta: 34.25, horaApertura: '14:30', comensales: 2 },
];

interface TablesState {
  mesas: Mesa[];
  setMesaEstado: (id: string, estado: MesaEstado, extra?: Partial<Mesa>) => void;
  liberarMesa: (id: string) => void;
  abrirMesa: (id: string, comensales?: number) => void;
}

export const useTablesStore = create<TablesState>((set) => ({
  mesas: MESAS_INICIALES,
  setMesaEstado: (id, estado, extra = {}) =>
    set((state) => ({
      mesas: state.mesas.map(m => m.id === id ? { ...m, estado, ...extra } : m),
    })),
  liberarMesa: (id) =>
    set((state) => ({
      mesas: state.mesas.map(m =>
        m.id === id ? { id: m.id, estado: 'LIBRE' } : m
      ),
    })),
  abrirMesa: (id, comensales = 2) =>
    set((state) => ({
      mesas: state.mesas.map(m =>
        m.id === id
          ? {
              ...m,
              estado: 'OCUPADA',
              horaApertura: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              comensales,
              totalCuenta: 0,
            }
          : m
      ),
    })),
}));
