/**
 * @module settingsApi
 * @description API de configuración del restaurante
 * SUME Docblock v2.0
 */
import { apiClient } from '@/core/api/apiClient';

export interface RestauranteConfig {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export const settingsApi = {
  getConfig: (): Promise<RestauranteConfig> =>
    apiClient.get<RestauranteConfig>('/restaurante/mi-restaurante'),

  updateConfig: (data: { nombre?: string; activo?: boolean }): Promise<RestauranteConfig> =>
    apiClient.put<RestauranteConfig>('/restaurante/mi-restaurante', data),
};
