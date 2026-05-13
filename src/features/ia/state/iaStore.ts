/**
 * @module iaStore
 * @description Estado global Zustand para el módulo de Asistente IA con function calling.
 * SUME Docblock v2.0
 */

import { create } from 'zustand';
import type { InformeIA, MensajeChat } from '../types';
import * as api from '../api/iaApi';

const SUGERENCIAS_DEFAULT = [
  '¿Cuánto he ganado hoy?',
  '¿Qué plato vendo más?',
  'Dame el resumen de la semana',
  'Añade a un empleado nuevo',
  'Registra un gasto',
];

interface IAState {
  historial: MensajeChat[];
  informe: InformeIA | null;
  sugerencias: string[];
  isLoading: boolean;
  isChatLoading: boolean;
  error: string | null;

  enviarMensaje: (texto: string) => Promise<void>;
  generarInforme: () => Promise<void>;
  cargarSugerencias: () => Promise<void>;
  limpiarChat: () => void;
}

export const useIAStore = create<IAState>((set, get) => ({
  historial: [],
  informe: null,
  sugerencias: SUGERENCIAS_DEFAULT,
  isLoading: false,
  isChatLoading: false,
  error: null,

  enviarMensaje: async (texto: string) => {
    const msgUsuario: MensajeChat = { rol: 'usuario', contenido: texto, timestamp: new Date() };
    set(s => ({ historial: [...s.historial, msgUsuario], isChatLoading: true, error: null }));

    try {
      const result = await api.chatIA(texto, get().historial);
      const msgIA: MensajeChat = {
        rol: 'asistente',
        contenido: result.respuesta,
        timestamp: new Date(),
        accion: result.accion ?? null,
      };
      set(s => ({ historial: [...s.historial, msgIA] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al contactar con el asistente IA' });
    } finally {
      set({ isChatLoading: false });
    }
  },

  generarInforme: async () => {
    set({ isLoading: true, error: null });
    try {
      const informe = await api.generarInforme();
      set({ informe });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al generar el informe' });
    } finally {
      set({ isLoading: false });
    }
  },

  cargarSugerencias: async () => {
    try {
      const sugerencias = await api.fetchSugerencias();
      if (sugerencias?.length) set({ sugerencias });
    } catch {
      // silencioso — usa sugerencias por defecto
    }
  },

  limpiarChat: () => set({ historial: [], error: null }),
}));
