/**
 * @module OrderHistoryPage
 * @description Tabla de auditoría para pedidos cerrados con filtros y exportación CSV.
 * SUME Docblock v2.0
 */
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHistoryStore } from '../state/historyStore';
import { useUsersStore } from '../../users/state/usersStore';
import type { User } from '../../users/types';
import { BottomNav } from '@/shared/components/BottomNav';
import styles from './OrderHistoryPage.module.css';

export const OrderHistoryPage: React.FC = () => {
  const { pedidos, isLoading, filters, setFilters, fetchHistory } = useHistoryStore();
  const { users, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchUsers();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRecaudado = pedidos.reduce((s, p) => s + p.total, 0);
  const totalPropinas  = pedidos.reduce((s, p) => s + (p.propina || 0), 0);

  const exportarCSV = () => {
    const headers = ['ID', 'Fecha', 'Mesa', 'Camarero', 'Subtotal', 'Propina', 'Total'];
    const rows = pedidos.map(p => [
      p.id,
      format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      p.mesa_numero || 'S/N',
      users.find((u: User) => u.id === p.usuario_id)?.nombre || 'Sistema',
      (p.total - (p.propina || 0)).toFixed(2),
      (p.propina || 0).toFixed(2),
      p.total.toFixed(2),
    ]);
    const csv  = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `ventas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1>Historial de Pedidos</h1>
            <p>Consulta y auditoría de ventas cerradas</p>
          </div>
          <button className={styles.exportBtn} onClick={exportarCSV} disabled={pedidos.length === 0}>
            📥 Exportar CSV
          </button>
        </div>

        {/* Stat cards en grid 2 columnas */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <span className={`${styles.statLabel} ${styles.statLabelGreen}`}>Total Ventas</span>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{totalRecaudado.toFixed(2)}€</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardAmber}`}>
            <span className={`${styles.statLabel} ${styles.statLabelAmber}`}>Propinas</span>
            <span className={`${styles.statValue} ${styles.statValueAmber}`}>{totalPropinas.toFixed(2)}€</span>
          </div>
        </div>
      </header>

      {/* ── Filtros ── */}
      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Fecha desde</label>
          <input type="date" className={styles.filterInput}
            value={filters.fecha_inicio || ''}
            onChange={e => setFilters({ fecha_inicio: e.target.value })} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Camarero</label>
          <select className={styles.filterSelect}
            value={filters.usuario_id || ''}
            onChange={e => setFilters({ usuario_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Todos</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        <button className={styles.filterBtn} onClick={() => fetchHistory()}>
          Aplicar Filtros
        </button>
      </section>

      {/* ── Tabla ── */}
      <div className={styles.tableWrapper}>
        {isLoading && <div className={styles.loadingState}>⏳ Cargando datos...</div>}
        {!isLoading && pedidos.length === 0 && (
          <div className={styles.emptyState}>📭 No hay pedidos cerrados en este periodo.</div>
        )}
        {!isLoading && pedidos.length > 0 && (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Fecha/Hora</th>
                <th className={styles.th}>Mesa</th>
                <th className={styles.th}>Camarero</th>
                <th className={`${styles.th} ${styles.thRight}`}>Subtotal</th>
                <th className={`${styles.th} ${styles.thRight}`}>Propina</th>
                <th className={`${styles.th} ${styles.thRight}`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdId}`}>#{p.id}</td>
                  <td className={styles.td}>
                    {format(new Date(p.created_at), 'dd MMM HH:mm', { locale: es })}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.mesaBadge}>Mesa {p.mesa_numero || 'S/N'}</span>
                  </td>
                  <td className={styles.td}>
                    {users.find((u: User) => u.id === p.usuario_id)?.nombre || 'Sistema'}
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    {(p.total - (p.propina || 0)).toFixed(2)}€
                  </td>
                  <td className={`${styles.td} ${styles.tdRight} ${styles.propina}`}>
                    {p.propina ? `+${p.propina.toFixed(2)}€` : '—'}
                  </td>
                  <td className={`${styles.td} ${styles.tdRight} ${styles.total}`}>
                    {p.total.toFixed(2)}€
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
