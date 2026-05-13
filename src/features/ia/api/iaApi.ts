/**
 * @module iaApi
 * @description Funciones de acceso a la API REST para el módulo de Asistente IA.
 * SUME Docblock v2.0
 * Entradas : mensaje (string), historial (MensajeChat[])
 * Lógica   : Llamadas HTTP via apiClient a los endpoints /ia/chat e /ia/informe
 * Salidas  : Promise<{respuesta: string}> o Promise<InformeIA>
 */

import { apiClient } from '@/core/api/apiClient';
import type { InformeIA, MensajeChat } from '../types';

export const chatIA = (
  mensaje: string,
  historial: MensajeChat[],
): Promise<{ respuesta: string; accion: import('../types').AccionEjecutada | null }> => {
  const historialMapeado = historial.map(m => ({
    rol: m.rol,
    contenido: m.contenido,
  }));
  return apiClient.post('/ia/chat', { mensaje, historial: historialMapeado });
};

export const generarInforme = (): Promise<InformeIA> =>
  apiClient.post<InformeIA>('/ia/informe');

export const fetchSugerencias = (): Promise<string[]> =>
  apiClient.get<string[]>('/ia/sugerencias');
