import { create } from 'zustand';
import type { ItemImportado, EstadoIngesta } from '../types/MenuIngestTypes';

interface MenuIngestState {
  items: ItemImportado[];
  estado: EstadoIngesta;
  csvFile: File | null;
  setItems: (items: ItemImportado[]) => void;
  setEstado: (estado: EstadoIngesta) => void;
  setCsvFile: (file: File | null) => void;
  clear: () => void;
}

export const useMenuIngestStore = create<MenuIngestState>((set) => ({
  items: [],
  estado: 'IDLE',
  csvFile: null,
  setItems: (items) => set({ items }),
  setEstado: (estado) => set({ estado }),
  setCsvFile: (csvFile) => set({ csvFile }),
  clear: () => set({ items: [], estado: 'IDLE', csvFile: null }),
}));
