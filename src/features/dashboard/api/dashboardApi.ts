/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/api/dashboardApi.ts
 * Tipo: Adaptador API → Estadísticas del día
 * Líneas: ~30 / 200 MAX
 *
 * Rutas backend:
 *   GET /stats/resumen?periodo=hoy  → StatsHoy
 *
 * Última Modificación: 2026-04-03 | Dajarony
 * Cambio: Implementación real de fetchStatsHoy y resetStats.
 * ===============================================================
 */
import type { StatsHoy } from '../types/DashboardTypes';

const base = () => import.meta.env.VITE_API_URL || '/api/v1';
const token = () => localStorage.getItem('comandero_token') || '';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

async function fetchStatsHoy(): Promise<StatsHoy> {
  const res = await fetch(`${base()}/stats/resumen?periodo=hoy`, { headers: headers() });
  if (!res.ok) throw new Error('No se pudieron cargar las estadísticas');
  const json = await res.json();
  return json.data as StatsHoy;
}

async function resetStats(): Promise<void> {
  // El backend no tiene endpoint de reset — recargamos simplemente
  await fetchStatsHoy();
}

export const dashboardApi = { fetchStatsHoy, resetStats };
