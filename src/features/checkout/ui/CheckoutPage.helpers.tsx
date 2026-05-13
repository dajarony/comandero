/**
 * @module CheckoutPage.helpers
 * @description Sub-componentes del cobro: lista de personas seleccionables, método de pago
 * SUME Docblock v2.0
 */
import { useState } from 'react';
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

/* ── División de cuenta ────────────────────────────────────── */
interface DivisionCuentaProps {
  total: number;
}

export function DivisionCuenta({ total }: DivisionCuentaProps) {
  const [partes, setPartes] = useState(2);
  const porPersona = partes > 0 ? total / partes : 0;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Dividir cuenta</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
        <button
          className={styles.tipBtn}
          onClick={() => setPartes(p => Math.max(1, p - 1))}
          style={{ padding: '8px 16px', fontSize: '1.2rem' }}
        >−</button>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, minWidth: 32, textAlign: 'center' }}>{partes}</span>
        <button
          className={styles.tipBtn}
          onClick={() => setPartes(p => p + 1)}
          style={{ padding: '8px 16px', fontSize: '1.2rem' }}
        >+</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>personas</span>
      </div>
      {partes > 1 && (
        <div style={{
          background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 14,
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
          fontWeight: 800, fontSize: '1.1rem', color: '#1d4ed8'
        }}>
          <span>Cada persona paga</span>
          <span>{porPersona.toFixed(2)}€</span>
        </div>
      )}
    </section>
  );
}

/* ── Calculador de cambio (solo EFECTIVO) ──────────────────── */
interface EfectivoCalcProps {
  total: number;
  efectivoRecibido: number;
  onChange: (v: number) => void;
  cambio: number;
}

export function EfectivoCalculator({ total, efectivoRecibido, onChange, cambio }: EfectivoCalcProps) {
  const BILLETES = [5, 10, 20, 50, 100];
  const sugeridos = BILLETES.filter(b => b >= total).slice(0, 3);

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Efectivo recibido</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {sugeridos.map(b => (
          <button
            key={b}
            className={`${styles.tipBtn} ${efectivoRecibido === b ? styles.tipBtnActive : ''}`}
            onClick={() => onChange(b)}
          >
            <span className={styles.tipLabel}>{b}€</span>
          </button>
        ))}
      </div>
      <div className={styles.customTipRow}>
        <span>Otro importe:</span>
        <input
          type="number"
          className={styles.tipInput}
          value={efectivoRecibido || ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder="0.00€"
          step="0.01"
        />
      </div>
      {cambio > 0 && (
        <div style={{
          background: '#dcfce7', border: '2px solid #86efac', borderRadius: 14,
          padding: '12px 16px', marginTop: 10, display: 'flex', justifyContent: 'space-between',
          fontWeight: 800, fontSize: '1.1rem', color: '#16a34a'
        }}>
          <span>Cambio a devolver</span>
          <span>{cambio.toFixed(2)}€</span>
        </div>
      )}
    </section>
  );
}

/* ── Selector de Descuento ─────────────────────────────────── */
interface DescuentoSelectorProps {
  subtotal: number;
  descuento: number;
  onChange: (d: number) => void;
}

export function DescuentoSelector({ subtotal, descuento, onChange }: DescuentoSelectorProps) {
  const opciones = [
    { label: 'Sin descuento', value: 0 },
    { label: '5%',  value: subtotal * 0.05 },
    { label: '10%', value: subtotal * 0.10 },
    { label: '15%', value: subtotal * 0.15 },
    { label: 'Invitación', value: subtotal },
  ];

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Descuento</h3>
      <div className={styles.tipsGrid}>
        {opciones.map(o => (
          <button
            key={o.label}
            className={`${styles.tipBtn} ${Math.abs(descuento - o.value) < 0.01 ? styles.tipBtnActive : ''}`}
            onClick={() => onChange(o.value)}
          >
            <span className={styles.tipLabel}>{o.label}</span>
            {o.value > 0 && <span className={styles.tipAmount}>-{o.value.toFixed(2)}€</span>}
          </button>
        ))}
      </div>
      <div className={styles.customTipRow}>
        <span>Personalizado (€):</span>
        <input
          type="number"
          className={styles.tipInput}
          value={descuento || ''}
          onChange={e => onChange(Math.min(Number(e.target.value), subtotal))}
          placeholder="0.00€"
          step="0.01"
        />
      </div>
    </section>
  );
}

/* ── Selector de Propina ───────────────────────────────────── */
interface TipSelectorProps {
  baseAmount: number;       // totalConDescuento — base para calcular %
  selectedPct: number;      // 0 | 10 | 15 | 20
  isCustom: boolean;        // si el usuario está en modo custom
  customVal: number;        // valor absoluto custom
  onSelectPct: (pct: number) => void;
  onCustomChange: (val: number) => void;
}

const TIP_OPTIONS = [
  { label: '0%',  pct: 0  },
  { label: '10%', pct: 10 },
  { label: '15%', pct: 15 },
  { label: '20%', pct: 20 },
];

export function TipSelector({ baseAmount, selectedPct, isCustom, customVal, onSelectPct, onCustomChange }: TipSelectorProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Propina sugerida</h3>
      <div className={styles.tipsGrid}>
        {TIP_OPTIONS.map(t => {
          const euros     = Math.round(baseAmount * t.pct) / 100;
          const isActive  = !isCustom && selectedPct === t.pct;
          return (
            <button
              key={t.label}
              className={`${styles.tipBtn} ${isActive ? styles.tipBtnActive : ''}`}
              onClick={() => onSelectPct(t.pct)}
            >
              <span className={styles.tipLabel}>{t.label}</span>
              <span className={styles.tipAmount}>{euros.toFixed(2)}€</span>
            </button>
          );
        })}
      </div>
      <div className={styles.customTipRow}>
        <span>Personalizada:</span>
        <input
          type="number"
          className={styles.tipInput}
          value={isCustom ? (customVal || '') : ''}
          onChange={e => onCustomChange(Number(e.target.value))}
          placeholder="0.00€"
          step="0.01"
        />
      </div>
    </section>
  );
}
