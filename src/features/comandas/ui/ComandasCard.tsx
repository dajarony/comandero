/** @module ComandasCard — SUME Docblock v2.0
 * Tarjeta individual de mesa con personas, acciones y ticket.
 * Entradas: MesaConPedidos + callbacks | Salidas: JSX card completa
 */
import { useState } from 'react';
import type { MesaConPedidos } from '../logic/useComandasFlow';
import { printTicketFromText } from '../logic/printTicket';
import { calcTiempo, calcTotal } from './ComandasPage.helpers';
import styles from './ComandasPage.module.css';

const PERSONA_COLORS = ['#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#22c55e', '#f59e0b'];

export interface ComandasCardProps {
  mcp: MesaConPedidos;
  onCobrar: (id: number) => void;
  onAddOrder: (id: number) => void;
  onAddToPersona: (mesaId: number, pedidoId: number) => void;
  onMarchar: (pedidoId: number) => Promise<void>;
  onRetener: (pedidoId: number) => Promise<void>;
  onLiberar: (pedidoId: number) => Promise<void>;
  onPrintTicket: (pedidoId: number) => Promise<string>;
  onUpdateNota: (mesaId: number, nota: string | null) => Promise<void>;
  onEliminarLinea: (pedidoId: number, lineaId: number) => Promise<void>;
}

export function ComandasCard(props: ComandasCardProps) {
  const { mcp, onCobrar, onAddOrder, onAddToPersona, onMarchar, onRetener, onLiberar, onPrintTicket, onUpdateNota, onEliminarLinea } = props;
  const { mesa, pedidos } = mcp;
  const [editNota, setEditNota] = useState(false);
  const [notaVal, setNotaVal] = useState(mesa.nota || '');
  const [ticketTexto, setTicketTexto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const safeAction = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const tiempo = calcTiempo(mesa.hora_apertura);
  const total = calcTotal(mcp);
  const esPendiente = mesa.estado === 'PENDIENTE_COBRO';
  const tieneAbiertos = pedidos.some(p => p.estado === 'ABIERTO');
  const tieneRetenidos = pedidos.some(p => p.estado === 'RETENIDO');

  const handleSaveNota = async () => {
    try { await onUpdateNota(mesa.id, notaVal.trim() || null); }
    catch { /* backend sin endpoint nota — ignorar */ }
    setEditNota(false);
  };
  const handlePrint = async (pedidoId: number) => {
    setTicketTexto(await onPrintTicket(pedidoId));
  };

  const borderClass = esPendiente ? styles.borderCobro :
    tieneRetenidos ? styles.borderRetenido :
    tieneAbiertos ? styles.borderAbierto : styles.borderMarchado;

  const estadoInfo = (p: { estado: string; destino?: string | null }) => {
    if (p.estado === 'ABIERTO')   return { label: '⏳ Sin enviar', cls: styles.estadoAbierto };
    if (p.estado === 'RETENIDO')  return { label: '⏸ Retenido',   cls: styles.estadoRetenido };
    if (p.destino === 'BARRA')    return { label: '🔵 En barra',   cls: styles.estadoMarchado };
    return                               { label: '🍳 En cocina',  cls: styles.estadoMarchado };
  };

  return (
    <div className={`${styles.card} ${borderClass}`}>
      {/* Cabecera */}
      <div className={styles.cardTop}>
        <div className={styles.cardTopLeft}>
          <span className={styles.mesaNum}>{mesa.numero}</span>
          <div className={styles.metaInfo}>
            <span className={styles.metaItem}>⏱ {tiempo}</span>
            {mesa.comensales && <span className={styles.metaItem}>👥 {mesa.comensales}</span>}
          </div>
        </div>
        <span className={`${styles.badge} ${esPendiente ? styles.badgeCobro : styles.badgeOcupada}`}>
          {esPendiente ? '💵 COBRAR' : '🟢 ABIERTA'}
        </span>
      </div>

      {/* Nota */}
      {editNota ? (
        <div className={styles.notaEdit}>
          <input className={styles.notaInput} value={notaVal} onChange={e => setNotaVal(e.target.value)}
            placeholder="Ej: cumpleaños, alérgico gluten..." maxLength={300} autoFocus />
          <button className={styles.notaSave} onClick={handleSaveNota}>✓</button>
          <button className={styles.notaCancel} onClick={() => setEditNota(false)}>✕</button>
        </div>
      ) : (
        <button className={styles.notaBtn} onClick={() => setEditNota(true)}>
          📝 {mesa.nota || 'Añadir nota...'}
        </button>
      )}

      {/* Personas */}
      <div className={styles.pedidosList}>
        {pedidos.map((pedido, idx) => {
          const color = PERSONA_COLORS[idx % PERSONA_COLORS.length];
          const puedeAnadir = pedido.estado === 'ABIERTO' || pedido.estado === 'RETENIDO';
          return (
            <div key={pedido.id} className={styles.pedidoRow} style={{ borderLeftColor: color }}>
              {/* Cabecera persona */}
              <div className={styles.pedidoHeader}>
                <div className={styles.personaInfo}>
                  <span className={styles.personaBadge} style={{ background: color }}>
                    👤 Persona {idx + 1}
                  </span>
                  <span className={`${styles.estadoTag} ${estadoInfo(pedido).cls}`}>{estadoInfo(pedido).label}</span>
                </div>
                <div className={styles.personaActions}>
                  {puedeAnadir && (
                    <button
                      className={styles.addPersonaBtn}
                      style={{ borderColor: color, color }}
                      onClick={() => onAddToPersona(mesa.id, pedido.id)}
                      title={`Añadir más a Persona ${idx + 1}`}
                    >
                      ➕
                    </button>
                  )}
                  {puedeAnadir && (
                    <button
                      className={`${styles.holdToggle} ${pedido.estado === 'RETENIDO' ? styles.holdActive : ''}`}
                      disabled={busy}
                      onClick={() => safeAction(() => pedido.estado === 'RETENIDO' ? onLiberar(pedido.id) : onRetener(pedido.id))}
                      title={pedido.estado === 'RETENIDO' ? 'Quitar espera' : 'Poner en espera'}
                    >
                      ⏸️
                    </button>
                  )}
                </div>
              </div>

              {/* Botón marchar / reimprimir */}
              {pedido.estado === 'ABIERTO' && (
                <div className={styles.pedidoActions}>
                  <button className={styles.marcharBtn} disabled={busy}
                    onClick={() => safeAction(() => onMarchar(pedido.id))}>📤 Marchar</button>
                </div>
              )}
              {pedido.estado === 'MARCHADO' && (
                <div className={styles.pedidoActions}>
                  <button className={styles.printBtn} onClick={() => handlePrint(pedido.id)}>🖨️ Reimprimir</button>
                </div>
              )}

              {/* Items */}
              <div className={styles.itemsList}>
                {pedido.lineas.map(l => (
                  <div key={l.id} className={styles.itemRow}>
                    <span className={styles.itemEmoji}>{l.item_emoji}</span>
                    <span className={styles.itemName}>{l.item_nombre}</span>
                    <span className={styles.itemQty}>x{l.cantidad}</span>
                    <span className={styles.itemPrice}>{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                    {puedeAnadir && (
                      <button className={styles.deleteLineaBtn} disabled={busy}
                        onClick={() => safeAction(() => onEliminarLinea(pedido.id, l.id))}
                        title="Eliminar línea">✕</button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>TOTAL · {pedidos.length} persona{pedidos.length !== 1 ? 's' : ''}</span>
          <span className={styles.totalAmount}>{total.toFixed(2)}€</span>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.addBtn} onClick={() => onAddOrder(mesa.id)}>👤 Nueva</button>
          <button className={styles.cobrarBtn} onClick={() => onCobrar(mesa.id)}>💵 Cobrar</button>
        </div>
      </div>

      {/* Modal ticket */}
      {ticketTexto !== null && (
        <div className={styles.ticketOverlay} onClick={() => setTicketTexto(null)}>
          <div className={styles.ticketModal} onClick={e => e.stopPropagation()}>
            <pre className={styles.ticketPre}>{ticketTexto}</pre>
            <button className={styles.printModalBtn} type="button"
              onClick={() => printTicketFromText(ticketTexto)}>🖨️ Imprimir</button>
            <button className={styles.ticketClose} type="button"
              onClick={() => setTicketTexto(null)}>✕ Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
