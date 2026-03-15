/**
 * @module ComandasPage.helpers
 * @description Helpers y componentes auxiliares para ComandasPage
 * SUME Docblock v2.0
 * Entradas : MesaConPedidos
 * Logica   : calculo de tiempo, total, resumen
 * Salidas  : SummaryBar, funciones helper
 */
import type { MesaConPedidos } from '../logic/useComandasFlow';
import styles from './ComandasPage.module.css';

export function calcTiempo(horaApertura: string | null): string {
  if (!horaApertura) return '—';
  const [h, m] = horaApertura.split(':').map(Number);
  const ahora = new Date();
  const mins = (ahora.getHours() * 60 + ahora.getMinutes()) - (h * 60 + m);
  if (mins < 0) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function calcTotal(mcp: MesaConPedidos): number {
  return mcp.pedidos.reduce((sum, p) => sum + p.total, 0);
}

export function SummaryBar({ datos }: { datos: MesaConPedidos[] }) {
  const pendientes = datos.filter(m => m.mesa.estado === 'PENDIENTE_COBRO').length;
  const sinMarchar = datos.filter(m =>
    m.pedidos.some(p => p.estado === 'ABIERTO')
  ).length;
  const retenidos = datos.filter(m =>
    m.pedidos.some(p => p.estado === 'RETENIDO')
  ).length;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryNum}>{datos.length}</span>
        <span className={styles.summaryLabel}>Abiertas</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={`${styles.summaryNum} ${styles.numCocina}`}>{sinMarchar}</span>
        <span className={styles.summaryLabel}>Sin marchar</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={`${styles.summaryNum} ${styles.numRetenido}`}>{retenidos}</span>
        <span className={styles.summaryLabel}>Retenidos</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={`${styles.summaryNum} ${styles.numCobro}`}>{pendientes}</span>
        <span className={styles.summaryLabel}>Cobro</span>
      </div>
    </div>
  );
}
