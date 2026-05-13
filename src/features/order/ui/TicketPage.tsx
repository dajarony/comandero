/**
 * @module TicketPage
 * @description Ticket digital post-MARCHAR — UI pura
 * SUME Docblock v2.0
 * Entradas : useTicketFlow (datos + handlers)
 * Lógica   : delegada a useTicketFlow.ts
 * Salidas  : JSX ticket con acciones de navegación
 */
import { useTicketFlow } from '../logic/useTicketFlow';
import { useAuthStore } from '@/features/auth/state/authStore';
import styles from './TicketPage.module.css';

export function TicketPage() {
    const {
        pedido, loading, ticketTexto, mesaNum,
        handleVolverMesas, handleVolverComanda,
        handleVerTicketCocina, handleCerrarTicket,
    } = useTicketFlow();
    const usuario = useAuthStore(s => s.usuario);

    if (loading) {
        return <div className={styles.loading}>⏳ Cargando ticket...</div>;
    }

    if (!pedido) {
        return (
            <div className={styles.loading}>
                <div style={{ textAlign: 'center' }}>
                    <p>❌ Pedido no encontrado</p>
                    <button className={styles.doneBtn} onClick={handleVolverMesas} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        ← Volver a Mesas
                    </button>
                </div>
            </div>
        );
    }

    const fecha = new Date(pedido.created_at);
    const fechaStr = fecha.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const horaStr = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit',
    });

    // Vista ticket cocina (texto plano)
    if (ticketTexto) {
        return (
            <div className={styles.container}>
                <pre className={styles.ticketTexto}>{ticketTexto}</pre>
                <div className={styles.actions}>
                    <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={handleCerrarTicket}>
                        ← Volver
                    </button>
                    <button className={`${styles.actionBtn} ${styles.doneBtn}`} onClick={handleVolverMesas}>
                        ✅ Mesas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.ticket}>
                {/* Header restaurante */}
                <div className={styles.ticketHeader}>
                    <div className={styles.ticketLogo}>🍴</div>
                    <h1 className={styles.ticketRestaurant}>{import.meta.env.VITE_RESTAURANT_NAME || 'Mi Restaurante'}</h1>
                    <p className={styles.ticketSubtitle}>Comandero Digital</p>
                </div>

                {/* Info rápida */}
                <div className={styles.ticketInfo}>
                    <div className={styles.ticketInfoItem}>
                        <span className={styles.ticketInfoLabel}>MESA</span>
                        <span className={styles.ticketInfoValue}>{mesaNum}</span>
                    </div>
                    <div className={styles.ticketInfoItem}>
                        <span className={styles.ticketInfoLabel}>FECHA</span>
                        <span className={styles.ticketInfoValue}>{fechaStr}</span>
                    </div>
                    <div className={styles.ticketInfoItem}>
                        <span className={styles.ticketInfoLabel}>HORA</span>
                        <span className={styles.ticketInfoValue}>{horaStr}</span>
                    </div>
                    <div className={styles.ticketInfoItem}>
                        <span className={styles.ticketInfoLabel}>CAMARERO</span>
                        <span className={styles.ticketInfoValue}>{usuario?.nombre || '—'}</span>
                    </div>
                </div>

                {/* Líneas del pedido */}
                <div className={styles.ticketItems}>
                    <p className={styles.ticketItemsTitle}>Detalle de comanda</p>
                    {pedido.lineas.map(linea => (
                        <div key={linea.id} className={styles.ticketItem}>
                            <span className={styles.ticketItemEmoji}>{linea.item_emoji}</span>
                            <div className={styles.ticketItemInfo}>
                                <p className={styles.ticketItemName}>{linea.item_nombre}</p>
                                {linea.nota && (
                                    <p className={styles.ticketItemNota}>📝 {linea.nota}</p>
                                )}
                                <p className={styles.ticketItemQty}>
                                    {linea.cantidad} × {linea.precio_unitario.toFixed(2)}€
                                </p>
                            </div>
                            <span className={styles.ticketItemSubtotal}>
                                {(linea.cantidad * linea.precio_unitario).toFixed(2)}€
                            </span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className={styles.ticketTotal}>
                    <span className={styles.ticketTotalLabel}>TOTAL</span>
                    <span className={styles.ticketTotalAmount}>{pedido.total.toFixed(2)}€</span>
                </div>

                {/* Estado */}
                <div className={styles.ticketStatus}>
                    <div className={styles.statusBadge}>
                        ✅ Pedido #{pedido.id} · {pedido.estado}
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={() => window.print()}>
                    🖨️ Imprimir
                </button>
                <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={handleVerTicketCocina}>
                    🧾 Cocina
                </button>
                <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={handleVolverComanda}>
                    🍽️ Comanda
                </button>
                <button className={`${styles.actionBtn} ${styles.doneBtn}`} onClick={handleVolverMesas}>
                    ✅ Mesas
                </button>
            </div>
        </div>
    );
}
