/**
 * @module ComandasPage
 * @description Comandas Abiertas — Personas por mesa con colores individuales
 * SUME Docblock v2.0
 */
import { useState } from 'react';
import { useComandasFlow } from '../logic/useComandasFlow';
import type { MesaConPedidos } from '../logic/useComandasFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import { SummaryBar, calcTiempo, calcTotal } from './ComandasPage.helpers';
import styles from './ComandasPage.module.css';

const PERSONA_COLORS = ['#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#22c55e', '#f59e0b'];

interface CardProps {
  mcp: MesaConPedidos;
  onCobrar: (id: number) => void;
  onAddOrder: (id: number) => void;
  onAddToPersona: (mesaId: number, pedidoId: number) => void;
  onMarcharDestino: (pedidoId: number, destino: string) => Promise<void>;
  onRetener: (pedidoId: number) => Promise<void>;
  onLiberar: (pedidoId: number) => Promise<void>;
  onPrintTicket: (pedidoId: number) => Promise<string>;
  onUpdateNota: (mesaId: number, nota: string | null) => Promise<void>;
}

function ComandasCard(props: CardProps) {
  const { mcp, onCobrar, onAddOrder, onAddToPersona, onMarcharDestino, onRetener, onLiberar, onPrintTicket, onUpdateNota } = props;
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
    await onUpdateNota(mesa.id, notaVal.trim() || null);
    setEditNota(false);
  };
  const handlePrint = async (pedidoId: number) => {
    setTicketTexto(await onPrintTicket(pedidoId));
  };

  const borderClass = esPendiente ? styles.borderCobro :
    tieneRetenidos ? styles.borderRetenido :
    tieneAbiertos ? styles.borderAbierto : styles.borderMarchado;

  const estadoLabel = (p: { estado: string; destino?: string | null }) =>
    p.estado === 'ABIERTO' ? '🟡 Sin enviar' :
    p.estado === 'RETENIDO' ? '🟠 Retenido' :
    p.destino === 'BARRA' ? '🔵 En barra' : '🔵 En cocina';

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
                  <span className={styles.estadoTag}>{estadoLabel(pedido)}</span>
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

              {/* Botones enviar */}
              {pedido.estado === 'ABIERTO' && (
                <div className={styles.pedidoActions}>
                  <button className={styles.enviarCocinaBtn} disabled={busy}
                    onClick={() => safeAction(() => onMarcharDestino(pedido.id, 'COCINA'))}>📤 Cocina</button>
                  <button className={styles.enviarBarraBtn} disabled={busy}
                    onClick={() => safeAction(() => onMarcharDestino(pedido.id, 'BARRA'))}>📤 Barra</button>
                </div>
              )}
              {pedido.estado === 'MARCHADO' && (
                <div className={styles.pedidoActions}>
                  <span className={styles.destinoTag}>{pedido.destino === 'BARRA' ? '🍺 Barra' : '🔥 Cocina'}</span>
                  <button className={styles.printBtn} onClick={() => handlePrint(pedido.id)}>🖨️ Ticket</button>
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
        <div className={styles.ticketOverlay}>
          <div className={styles.ticketModal}>
            <pre className={styles.ticketPre}>{ticketTexto}</pre>
            <button className={styles.ticketClose} type="button"
              onPointerDown={(e) => { e.stopPropagation(); setTicketTexto(null); }}>
              ✕ Cerrar
            </button>
          </div>
          <div className={styles.ticketBackdrop} onPointerDown={() => setTicketTexto(null)} />
        </div>
      )}
    </div>
  );
}

export function ComandasPage() {
  const {
    mesasConPedidos, loading, error, refresh, handleTapCobrar, handleTapAddOrder,
    handleMarcharDestino, handleRetenerPedido, handleLiberarPedido, handlePrintTicket,
    handleUpdateNota, handleAddToPersona,
  } = useComandasFlow();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>📋</div>
          <h1 className={styles.headerTitle}>Comandas</h1>
        </div>
        <button className={styles.refreshBtn} onClick={refresh}>🔄</button>
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
              onMarcharDestino={handleMarcharDestino} onRetener={handleRetenerPedido}
              onLiberar={handleLiberarPedido} onPrintTicket={handlePrintTicket}
              onUpdateNota={handleUpdateNota} />
          ))}
        </section>
      )}

      <BottomNav />
    </div>
  );
}
