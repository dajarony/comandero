import { create } from 'zustand';
import type { ItemImportado, EstadoIngesta } from '../types/MenuIngestTypes';

interface MenuIngestState {
  items: ItemImportado[];
  estado: EstadoIngesta;
  setItems: (items: ItemImportado[]) => void;
  setEstado: (estado: EstadoIngesta) => void;
  clear: () => void;
}

export const useMenuIngestStore = create<MenuIngestState>((set) => ({
  items: [],
  estado: 'IDLE',
  setItems: (items) => set({ items }),
  setEstado: (estado) => set({ estado }),
  clear: () => set({ items: [], estado: 'IDLE' }),
}));
