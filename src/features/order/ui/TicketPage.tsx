/**
 * TicketPage — Ticket digital post-MARCHAR
 * Muestra la comanda como recibo con navegación clara
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { useAuthStore } from '@/features/auth/state/authStore';
import styles from './TicketPage.module.css';

interface LineaPedido {
    id: number;
    item_menu_id: number;
    item_nombre: string;
    item_emoji: string;
    cantidad: number;
    precio_unitario: number;
    nota: string;
}

interface Pedido {
    id: number;
    mesa_id: number;
    usuario_id: number;
    estado: string;
    total: number;
    created_at: string;
    lineas: LineaPedido[];
}

export function TicketPage() {
    const { pedidoId } = useParams<{ pedidoId: string }>();
    const [searchParams] = useSearchParams();
    const mesaNum = searchParams.get('mesa') || '?';
    const navigate = useNavigate();
    const usuario = useAuthStore(s => s.usuario);

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [ticketTexto, setTicketTexto] = useState<string | null>(null);

    useEffect(() => {
        if (!pedidoId) return;
        orderApi.fetchPedido(Number(pedidoId))
            .then(setPedido)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [pedidoId]);

    const handleVolverMesas = () => navigate('/mesas', { replace: true });
    const handleVolverComanda = () => {
        if (pedido) navigate(`/comanda/${pedido.mesa_id}`, { replace: true });
        else navigate('/mesas', { replace: true });
    };

    const handleVerTicketCocina = async () => {
        if (!pedidoId) return;
        try {
            const texto = await orderApi.fetchTicketTexto(Number(pedidoId));
            setTicketTexto(texto);
        } catch (err) {
            console.error('Error ticket cocina:', err);
        }
    };

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
                    <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={() => setTicketTexto(null)}>
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

            {/* Acciones — siempre visibles, sin window.open ni window.print */}
            <div className={styles.actions}>
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
