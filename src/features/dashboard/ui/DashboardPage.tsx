/**
 * ===============================================================
 * SUME DOCBLOCK v2.0
 * ===============================================================
 * Archivo: features/dashboard/ui/DashboardPage.tsx
 * Tipo: UI → Pagina de Estadisticas del Dia
 * Lineas: ~120 / 200 MAX
 *
 * Acciones:
 * - Muestra tarjetas resumen (ventas, pedidos, mesas, ticket)
 * - Lista top 10 items mas vendidos
 * - Muestra ventas por hora
 *
 * Ultima Modificacion: 2026-03-15 | Dajarony
 * Cambio: Implementacion real con datos del backend.
 * ===============================================================
 */

import { BottomNav } from '@/shared/components/BottomNav';
import { useDashboardFlow } from '../logic/useDashboardFlow';
import type { TopItem } from '../types/DashboardTypes';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { stats, loading, error, refrescar, resetear } = useDashboardFlow();

  return (
    <div className={styles.container}>
      <Header onRefresh={refrescar} onReset={resetear} />

      {loading && (
        <div className={styles.loadingWrap}>Cargando estadisticas...</div>
      )}

      {error && <div className={styles.errorWrap}>{error}</div>}

      {!loading && !error && stats && (
        <>
          <SummaryCards
            ventas={stats.ventas_total}
            pedidos={stats.pedidos_count}
            mesas={stats.mesas_atendidas}
            ticket={stats.ticket_medio}
          />

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Top 10 Items</h2>
            {stats.top_items.length === 0 && (
              <p className={styles.emptyWrap}>Sin ventas hoy</p>
            )}
            <div className={styles.topList}>
              {stats.top_items.map((item, i) => (
                <TopItemRow key={item.nombre} item={item} rank={i + 1} />
              ))}
            </div>
          </section>

          {stats.ventas_por_hora.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Ventas por Hora</h2>
              <div className={styles.hoursGrid}>
                {stats.ventas_por_hora.map((h) => (
                  <div key={h.hora} className={styles.hourCard}>
                    <div className={styles.hourLabel}>{h.hora}</div>
                    <div className={styles.hourTotal}>{h.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!loading && !error && !stats && (
        <p className={styles.emptyWrap}>Sin datos disponibles</p>
      )}

      <BottomNav />
    </div>
  );
}

/* ── Sub-componentes internos ──────────────────────────────── */

function Header({ onRefresh, onReset }: { onRefresh: () => void; onReset: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>📊</div>
        <h1 className={styles.title}>Estadisticas del Dia</h1>
      </div>
      <div className={styles.headerActions}>
        <button className={styles.resetBtn} onClick={onReset}>🗑️ Reset</button>
        <button className={styles.refreshBtn} onClick={onRefresh}>🔄</button>
      </div>
    </header>
  );
}

function SummaryCards(props: {
  ventas: number;
  pedidos: number;
  mesas: number;
  ticket: number;
}) {
  return (
    <div className={styles.summaryGrid}>
      <StatCard icon="💰" value={`${props.ventas.toFixed(2)}`} label="Ventas Total" accent />
      <StatCard icon="🧾" value={`${props.pedidos}`} label="Pedidos" accent />
      <StatCard icon="🪑" value={`${props.mesas}`} label="Mesas Atendidas" />
      <StatCard icon="🎯" value={`${props.ticket.toFixed(2)}`} label="Ticket Medio" />
    </div>
  );
}

function StatCard(p: {
  icon: string;
  value: string;
  label: string;
  accent?: boolean;
}) {
  const cls = `${styles.card} ${p.accent ? styles.cardAccent : ''}`;
  return (
    <div className={cls}>
      <span className={styles.cardIcon}>{p.icon}</span>
      <span className={styles.cardValue}>{p.value}</span>
      <span className={styles.cardLabel}>{p.label}</span>
    </div>
  );
}

function TopItemRow({ item, rank }: { item: TopItem; rank: number }) {
  return (
    <div className={styles.topItem}>
      <span className={styles.topRank}>{rank}</span>
      <span className={styles.topEmoji}>{item.emoji}</span>
      <div className={styles.topInfo}>
        <div className={styles.topName}>{item.nombre}</div>
        <div className={styles.topQty}>{item.cantidad} uds</div>
      </div>
      <span className={styles.topTotal}>{item.total.toFixed(2)}</span>
    </div>
  );
}

export default DashboardPage;
