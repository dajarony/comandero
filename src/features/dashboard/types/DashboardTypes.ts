/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/types/DashboardTypes.ts
 * Tipo: Contrato → Tipos de Estadisticas
 * Lineas: ~35 / 200 MAX
 *
 * Interfaces para la respuesta de GET /stats/hoy
 *
 * Ultima Modificacion: 2026-03-15 | Dajarony
 * Cambio: Implementacion inicial de tipos de estadisticas.
 * ===============================================================
 */

export interface TopItem {
  nombre: string;
  emoji: string;
  cantidad: number;
  total: number;
}

export interface VentaHora {
  hora: string;
  total: number;
}

export interface StatsHoy {
  ventas_total: number;
  pedidos_count: number;
  mesas_atendidas: number;
  ticket_medio: number;
  top_items: TopItem[];
  ventas_por_hora: VentaHora[];
}
