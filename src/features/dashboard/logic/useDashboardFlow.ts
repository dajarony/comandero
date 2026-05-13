/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/logic/useDashboardFlow.ts
 * Tipo: Logic Block → Carga de Estadisticas
 * Lineas: ~40 / 200 MAX
 *
 * Acciones:
 * - Carga estadisticas al montar el componente
 * - Gestiona loading/error via store
 *
 * Ultima Modificacion: 2026-03-15 | Dajarony
 * Cambio: Implementacion real con dashboardApi.
 * ===============================================================
 */

import { useEffect } from 'react';
import { handleError } from '@/core/errors/errorHandler';
import { dashboardApi } from '../api/dashboardApi';
import { useDashboardStore } from '../state/dashboardStore';

export function useDashboardFlow() {
  const { stats, loading, error, setStats, setLoading, setError } =
    useDashboardStore();

  const cargarStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.fetchStatsHoy();
      setStats(data);
    } catch (err) {
      handleError(err, 'DASHBOARD_FAILED');
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetear = async () => {
    if (!confirm('¿Seguro que quieres resetear las estadísticas de hoy?')) return;
    setLoading(true);
    try {
      await dashboardApi.resetStats();
      await cargarStats();
    } catch (err) {
      handleError(err, 'RESET_STATS_FAILED');
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return { stats, loading, error, refrescar: cargarStats, resetear };
}
