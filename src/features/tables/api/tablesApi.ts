/**
 * Tables API — Conecta con el backend real
 */
import { apiClient } from '@/core/api/apiClient';
import type { Mesa } from '../types/TablesTypes';

export const tablesApi = {
  /** Lista todas las mesas */
  fetchMesas: (): Promise<Mesa[]> =>
    apiClient.get<Mesa[]>('/mesas'),

  /** Abrir mesa con comensales (backend espera query param) */
  abrirMesa: (mesaId: number, comensales: number): Promise<Mesa> =>
    apiClient.post<Mesa>(`/mesas/${mesaId}/abrir?comensales=${comensales}`),

  /** Liberar mesa */
  liberarMesa: (mesaId: number): Promise<Mesa> =>
    apiClient.post<Mesa>(`/mesas/${mesaId}/liberar`),

  /** Cambiar estado de mesa */
  cambiarEstado: (mesaId: number, estado: string): Promise<Mesa> =>
    apiClient.put<Mesa>(`/mesas/${mesaId}/estado`, { estado }),

  /** Actualizar nota de mesa */
  actualizarNota: (mesaId: number, nota: string | null): Promise<Mesa> =>
    apiClient.put<Mesa>(`/mesas/${mesaId}/nota`, { nota }),
};
