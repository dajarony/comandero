/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/api/dashboardApi.ts
 * Tipo: Adaptador API → Estadisticas del Dia
 * Lineas: ~20 / 200 MAX
 *
 * Acciones:
 * - Llama a GET /stats/hoy via apiClient
 *
 * Ultima Modificacion: 2026-03-15 | Dajarony
 * Cambio: Conectar con endpoint real de estadisticas.
 * ===============================================================
 */

import { apiClient } from '@/core/api/apiClient';
import type { StatsHoy } from '../types/DashboardTypes';

export const dashboardApi = {
  fetchStatsHoy: () => apiClient.get<StatsHoy>('/stats/hoy'),
};
