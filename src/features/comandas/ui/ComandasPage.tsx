/**
 * @module ComandasPage
 * @description Comandas Abiertas — Lista de mesas con pedidos activos
 * SUME Docblock v2.0
 * Entradas : useComandasFlow (datos + acciones)
 * Lógica   : renderiza lista de ComandasCard por mesa
 * Salidas  : JSX página completa con BottomNav
 */
import { useComandasFlow } from '../logic/useComandasFlow';
import { ComandasCard } from './ComandasCard';
import { BottomNav } from '@/shared/components/BottomNav';
import { SummaryBar } from './ComandasPage.helpers';
import styles from './ComandasPage.module.css';

export function ComandasPage() {
  const {
    mesasConPedidos, loading, error, refresh, handleTapCobrar, handleTapAddOrder,
    handleMarcharPedido, handleRetenerPedido, handleLiberarPedido, handlePrintTicket,
    handleUpdateNota, handleAddToPersona, handleEliminarLinea,
  } = useComandasFlow();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>📋</div>
          <h1 className={styles.headerTitle}>Comandas</h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={refresh}>🔄</button>
        </div>
      </header>

      {!loading && !error && mesasConPedidos.length > 0 && <SummaryBar datos={mesasConPedidos} />}
      {loading && <div className={styles.stateBox}><p className={styles.stateText}>⏳ Cargando...</p></div>}
      {!loading && error && <div className={styles.stateBox}><p className={styles.errorText}>❌ {error}</p></div>}

      {!loading && !error && mesasConPedidos.length === 0 && (
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>🎉</span>
          <p className={styles.emptyTitle}>No hay comandas abiertas</p>
          <p className={styles.emptySubtitle}>Todas las mesas están libres</p>
        </div>
      )}

      {!loading && !error && mesasConPedidos.length > 0 && (
        <section className={styles.list}>
          {mesasConPedidos.map(mcp => (
            <ComandasCard key={mcp.mesa.id} mcp={mcp}
              onCobrar={handleTapCobrar} onAddOrder={handleTapAddOrder}
              onAddToPersona={handleAddToPersona}
              onMarchar={handleMarcharPedido} onRetener={handleRetenerPedido}
              onLiberar={handleLiberarPedido} onPrintTicket={handlePrintTicket}
              onUpdateNota={handleUpdateNota}
              onEliminarLinea={handleEliminarLinea} />
          ))}
        </section>
      )}

      <BottomNav />
    </div>
  );
}
