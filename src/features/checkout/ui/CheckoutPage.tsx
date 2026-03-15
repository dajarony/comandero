/**
 * @module CheckoutPage
 * @description Cobro con selección de comandas — split billing por comanda
 * SUME Docblock v2.0
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useCheckoutFlow } from '../logic/useCheckoutFlow';
import { ComandasList, MetodoPagoSelector } from './CheckoutPage.helpers';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const { mesaId = '1' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const flow = useCheckoutFlow(mesaId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/comandas')}>
          ← Comandas
        </button>
        <h2 className={styles.title}>Cobro · Mesa {mesaId}</h2>
        <div style={{ width: 60 }} />
      </header>

      {flow.loading && <p className={styles.loadingText}>Cargando cuenta...</p>}

      {flow.errorMsg && (
        <div className={styles.errorBanner}>{flow.errorMsg}</div>
      )}

      {!flow.loading && flow.pedidos.length === 0 && (
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyTitle}>No hay comandas activas</p>
        </div>
      )}

      {!flow.loading && flow.pedidos.length > 0 && (
        <>
          <ComandasList
            pedidos={flow.pedidos}
            selected={flow.selected}
            onToggle={flow.toggleSelect}
            allSelected={flow.allSelected}
            onSelectAll={flow.selectAll}
            onSelectNone={flow.selectNone}
          />

          <MetodoPagoSelector
            metodoPago={flow.metodoPago}
            onChange={flow.setMetodoPago}
          />

          <div className={styles.fabContainer}>
            <button
              className={styles.cobrarBtn}
              onClick={flow.handleCobrar}
              disabled={flow.cobrando || flow.selected.size === 0}
            >
              {flow.cobrando
                ? '⏳ Procesando...'
                : `💵 COBRAR ${flow.totalSelected.toFixed(2)}€`}
            </button>
            {!flow.allSelected && flow.selected.size > 0 && (
              <p className={styles.partialNote}>
                Cobro parcial · La mesa seguirá abierta
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
