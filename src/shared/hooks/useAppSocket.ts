/**
 * @module useAppSocket
 * @description Hook global para gestionar notificaciones WebSocket.
 */
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useKitchenStore } from '@/features/kitchen/state/kitchenStore';
import { useAuthStore } from '@/features/auth/state/authStore';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 5000;

interface SocketOrderLine {
    item_nombre: string;
}

interface SocketOrder {
    mesa_numero?: string | number;
    lineas?: SocketOrderLine[];
}

interface AppSocketMessage {
    event: string;
    pedido_id: number;
    pedido?: SocketOrder;
}

export const useAppSocket = () => {
    const { removeOrder } = useKitchenStore();
    const token = useAuthStore(state => state.token);
    const retriesRef = useRef(0);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let retryId: number | undefined;

        const connect = () => {
            if (!token || retriesRef.current >= MAX_RETRIES) return;

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/kitchen';

            try {
                const socket = new WebSocket(wsUrl, ['comandero-jwt', token]);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log('App WebSocket connected');
                    retriesRef.current = 0;
                };

                socket.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data) as AppSocketMessage;

                        if (payload.event === 'ORDER_READY') {
                            const pedido = payload.pedido;
                            const mesaNum = pedido?.mesa_numero || '??';
                            const platos = pedido?.lineas
                                ?.map(linea => linea.item_nombre)
                                .slice(0, 2)
                                .join(', ');
                            const suffix = (pedido?.lineas?.length ?? 0) > 2 ? '...' : '';

                            toast.success(`Mesa ${mesaNum} - ${platos}${suffix} listo!`, {
                                duration: 6000,
                                position: 'top-center',
                                style: {
                                    background: '#10b981',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    border: '2px solid #059669',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                },
                                icon: 'OK'
                            });

                            removeOrder(payload.pedido_id);
                        }
                    } catch (error) {
                        console.error('Error parsing WS message:', error);
                    }
                };

                socket.onclose = () => {
                    retriesRef.current += 1;
                    const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current - 1);
                    if (retriesRef.current < MAX_RETRIES) {
                        retryId = window.setTimeout(connect, delay);
                    }
                };

                socket.onerror = () => {
                    socket.close();
                };
            } catch {
                console.warn('WebSocket: no se pudo crear la conexion');
            }
        };

        retriesRef.current = 0;
        connect();

        return () => {
            retriesRef.current = MAX_RETRIES;
            if (retryId) window.clearTimeout(retryId);
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close();
            }
        };
    }, [removeOrder, token]);
};
