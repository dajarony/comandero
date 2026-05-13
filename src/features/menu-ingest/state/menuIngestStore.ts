/**
 * @module menuIngestStore
 * @description Store Zustand de ingesta de carta — estado del flujo CSV
 * SUME Docblock v2.0
 * Entradas : items[], estado, csvFile
 * Lógica   : Almacena estado de ingesta con setters y clear
 * Salidas  : useMenuIngestStore hook con state y actions
 */
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
