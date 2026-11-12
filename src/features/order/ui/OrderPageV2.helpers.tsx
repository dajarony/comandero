/**
 * OrderPageV2.helpers — Sub-componentes del comandero
 * SUME Docblock v2.0 | Entradas: props tipadas | Salidas: JSX
 */
import styles from './OrderPageV2.module.css';
import type { MenuItemApi } from '../api/orderApi';

export interface LineaCarrito { item: MenuItemApi; cantidad: number; nota: string; }

// ── Carrito Bottom Sheet ──────────────────────────────────────────────────────
interface CarritoSheetProps {
  carrito: LineaCarrito[];
  total: number;
  onClose: () => void;
  onAdd: (item: MenuItemApi) => void;
  onRemove: (id: number) => void;
  onUpdateNota: (id: number, nota: string) => void;
  onRepetirRonda: () => void;
  tieneUltimaRonda: boolean;
  onMarchar: () => void;
  enviando: boolean;
}

export function CarritoSheet({ carrito, total, onClose, onAdd, onRemove, onUpdateNota, onRepetirRonda, tieneUltimaRonda, onMarchar, enviando }: CarritoSheetProps) {
  return (
    <div className={styles.carritoOverlay}>
      <div className={styles.carritoBackdrop} onClick={onClose} />
      <div className={styles.carritoSheet}>
        <div className={styles.carritoHeader}>
          <h3 className={styles.carritoTitle}>📋 Comanda</h3>
          <button className={styles.carritoClose} onClick={onClose}>✕</button>
        </div>
        {carrito.map((linea) => (
          <div key={linea.item.id} className={styles.carritoLinea}>
            <span className={styles.carritoLineaEmoji}>{linea.item.emoji}</span>
            <div className={styles.carritoLineaInfo}>
              <p className={styles.carritoLineaNombre}>{linea.item.nombre}</p>
              <input
                type="text"
                className={styles.notaInput}
                placeholder="Nota: sin sal, poco hecho..."
                value={linea.nota}
                onChange={e => onUpdateNota(linea.item.id, e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className={styles.carritoLineaControls}>
              <button className={`${styles.qtyBtn} ${styles.qtyBtnMinus}`}
                onClick={e => { e.stopPropagation(); onRemove(linea.item.id); }}>−</button>
              <span className={styles.qtyNum}>{linea.cantidad}</span>
              <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`}
                onClick={e => { e.stopPropagation(); onAdd(linea.item); }}>+</button>
            </div>
            <span className={styles.carritoLineaSubtotal}>{(linea.item.precio * linea.cantidad).toFixed(2)}€</span>
          </div>
        ))}
        {tieneUltimaRonda && (
          <button className={styles.repetirRondaBtn} onClick={onRepetirRonda}>🔄 Repetir ronda</button>
        )}
        <div className={styles.carritoTotal}><span>Total</span><span>{total.toFixed(2)}€</span></div>
        <button className={styles.marchBtnCarrito} onClick={onMarchar} disabled={enviando}>
           {enviando ? 'Guardando…' : `Guardar comanda · ${total.toFixed(2)} €`}
        </button>
      </div>
    </div>
  );
}

// ── Botón Pedir la cuenta ─────────────────────────────────────────────────────
interface PedirCuentaBtnProps { onPedir: () => Promise<void>; enviando: boolean; }
export function PedirCuentaBtn({ onPedir, enviando }: PedirCuentaBtnProps) {
  return (
    <div className={styles.pedirCuentaWrapper}>
      <button className={styles.pedirCuentaBtn} onClick={onPedir} disabled={enviando}>
        {enviando ? '⏳ Enviando...' : '🧾 Pedir la cuenta'}
      </button>
    </div>
  );
}
