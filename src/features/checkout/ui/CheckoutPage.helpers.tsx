/**
 * @module CheckoutPage.helpers
 * @description Sub-componentes del cobro: lista de personas seleccionables, método de pago
 * SUME Docblock v2.0
 */
import type { PedidoApi } from '@/features/order/api/orderApi';
import type { MetodoPago } from '../types/CheckoutTypes';
import styles from './CheckoutPage.module.css';

const PERSONA_COLORS = ['#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#22c55e', '#f59e0b'];

/* ── Persona Card (una por pedido) ─────────────────────────── */
interface ComandaCardProps {
  pedido: PedidoApi;
  idx: number;
  checked: boolean;
  onToggle: (id: number) => void;
}

function ComandaCard({ pedido, idx, checked, onToggle }: ComandaCardProps) {
  const color = PERSONA_COLORS[idx % PERSONA_COLORS.length];
  const estadoLabel = pedido.estado === 'ABIERTO' ? '🟡 Sin enviar'
    : pedido.estado === 'RETENIDO' ? '🟠 Retenido'
    : pedido.destino === 'BARRA' ? '🔵 En barra' : '🔵 En cocina';

  return (
    <div
      className={`${styles.comandaCard} ${checked ? styles.comandaCardSelected : ''}`}
      style={{ borderLeftColor: checked ? color : undefined }}
      onClick={() => onToggle(pedido.id)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.comandaTop}>
        <input
          type="checkbox"
          className={styles.comandaCheck}
          checked={checked}
          onChange={() => onToggle(pedido.id)}
          onClick={e => e.stopPropagation()}
        />
        <span className={styles.comandaLabel} style={{ color }}>👤 Persona {idx + 1}</span>
        <span className={styles.comandaEstado}>{estadoLabel}</span>
      </div>
      <div className={styles.comandaItems}>
        {pedido.lineas.map(l => (
          <div key={l.id} className={styles.comandaLine}>
            <span>{l.item_emoji}</span>
            <span className={styles.comandaLineName}>{l.item_nombre}</span>
            <span className={styles.comandaLineQty}>x{l.cantidad}</span>
            <span className={styles.comandaLinePrice}>
              {(l.cantidad * l.precio_unitario).toFixed(2)}€
            </span>
          </div>
        ))}
      </div>
      <div className={styles.comandaSubtotal}>
        <span>Subtotal</span>
        <span className={styles.comandaSubtotalAmount}>{pedido.total.toFixed(2)}€</span>
      </div>
    </div>
  );
}

/* ── Lista de comandas seleccionables ──────────────────────── */
interface ComandasListProps {
  pedidos: PedidoApi[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  allSelected: boolean;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function ComandasList(props: ComandasListProps) {
  const { pedidos, selected, onToggle, allSelected, onSelectAll, onSelectNone } = props;
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Selecciona comandas a cobrar</h3>
        <button className={styles.toggleAllBtn} onClick={allSelected ? onSelectNone : onSelectAll}>
          {allSelected ? 'Ninguna' : 'Todas'}
        </button>
      </div>
      {pedidos.map((p, idx) => (
        <ComandaCard key={p.id} pedido={p} idx={idx} checked={selected.has(p.id)} onToggle={onToggle} />
      ))}
    </section>
  );
}

/* ── Selector de método de pago ────────────────────────────── */
const METODOS: { key: MetodoPago; emoji: string; label: string }[] = [
  { key: 'EFECTIVO', emoji: '💵', label: 'Efectivo' },
  { key: 'TARJETA', emoji: '💳', label: 'Tarjeta' },
  { key: 'QR', emoji: '📱', label: 'QR/Bizum' },
];

interface MetodoPagoProps {
  metodoPago: MetodoPago;
  onChange: (m: MetodoPago) => void;
}

export function MetodoPagoSelector({ metodoPago, onChange }: MetodoPagoProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Método de pago</h3>
      <div className={styles.metodosGrid}>
        {METODOS.map(m => (
          <button
            key={m.key}
            className={`${styles.metodoBtn} ${metodoPago === m.key ? styles.metodoBtnActive : ''}`}
            onClick={() => onChange(m.key)}
          >
            <span className={styles.metodoEmoji}>{m.emoji}</span>
            <span className={styles.metodoLabel}>{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
