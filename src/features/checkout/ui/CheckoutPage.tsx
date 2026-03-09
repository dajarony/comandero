import { useParams, useNavigate } from 'react-router-dom';
import { useCheckoutFlow } from '../logic/useCheckoutFlow';
import type { MetodoPago } from '../types/CheckoutTypes';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const {
    itemsResumen, total, numPersonas, setNumPersonas,
    cuotaPorPersona, metodoPago, setMetodoPago, handleCobrar,
  } = useCheckoutFlow(mesaId);

  const metodos: { key: MetodoPago; emoji: string; label: string }[] = [
    { key: 'EFECTIVO', emoji: '💵', label: 'Efectivo' },
    { key: 'TARJETA', emoji: '💳', label: 'Tarjeta' },
    { key: 'QR', emoji: '📱', label: 'QR/Bizum' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mesas')}>
          ← Mesas
        </button>
        <h2 className={styles.title}>Cobro · Mesa {mesaId}</h2>
        <div style={{ width: 60 }} />
      </header>

      {/* Resumen de cuenta */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resumen de cuenta</h3>
        {itemsResumen.length === 0 ? (
          <p className={styles.empty}>Sin items en la comanda</p>
        ) : (
          itemsResumen.map((item, i) => (
            <div key={i} className={styles.lineaItem}>
              <span className={styles.itemEmoji}>{item.emoji}</span>
              <span className={styles.itemNombre}>{item.nombre}</span>
              <span className={styles.itemQty}>×{item.cantidad}</span>
              <span className={styles.itemSubtotal}>{item.subtotal.toFixed(2)}€</span>
            </div>
          ))
        )}
        <div className={styles.totalRow}>
          <span>TOTAL</span>
          <span className={styles.totalAmount}>{total.toFixed(2)}€</span>
        </div>
      </section>

      {/* Split Bill */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Dividir cuenta</h3>
        <div className={styles.splitControls}>
          <button
            className={styles.splitBtn}
            onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
          >−</button>
          <div className={styles.splitInfo}>
            <span className={styles.splitNum}>{numPersonas}</span>
            <span className={styles.splitLabel}>persona{numPersonas > 1 ? 's' : ''}</span>
          </div>
          <button
            className={styles.splitBtn}
            onClick={() => setNumPersonas(numPersonas + 1)}
          >+</button>
        </div>
        {numPersonas > 1 && (
          <div className={styles.cuotaBox}>
            <span className={styles.cuotaLabel}>Cada persona paga</span>
            <span className={styles.cuotaAmount}>{cuotaPorPersona.toFixed(2)}€</span>
          </div>
        )}
      </section>

      {/* Método de pago */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Método de pago</h3>
        <div className={styles.metodosGrid}>
          {metodos.map(m => (
            <button
              key={m.key}
              className={`${styles.metodoBtn} ${metodoPago === m.key ? styles.metodoBtnActive : ''}`}
              onClick={() => setMetodoPago(m.key)}
            >
              <span className={styles.metodoEmoji}>{m.emoji}</span>
              <span className={styles.metodoLabel}>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Botón cobrar */}
      <div className={styles.fabContainer}>
        <button className={styles.cobrarBtn} onClick={handleCobrar}>
          ✅ COBRAR {total.toFixed(2)}€ · {metodoPago}
        </button>
      </div>
    </div>
  );
}
