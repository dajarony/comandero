/**
 * @module useKitchenSocket
 * @description Hook para gestionar la conexion WebSocket de la pantalla de cocina.
 */
import { useEffect } from 'react';
import { useKitchenStore } from '../state/kitchenStore';
import type { PedidoApi } from '@/features/order/api/orderApi';

interface KitchenSocketMessage {
    event: string;
    pedido?: PedidoApi;
    mesa_id?: number;
}

export const useKitchenSocket = () => {
    const { addOrder, removeOrder, removeTable, setConnected, fetchActiveOrders } = useKitchenStore();

    useEffect(() => {
        let socket: WebSocket | undefined;
        let retryId: number | undefined;
        let disposed = false;

        const connect = () => {
            const token = localStorage.getItem('comandero_token');
            if (!token) return;

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/kitchen';

            socket = new WebSocket(wsUrl, ['comandero-jwt', token]);

            socket.onopen = () => {
                console.log('KDS WebSocket connected');
                setConnected(true);
                void fetchActiveOrders();
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data) as KitchenSocketMessage;

                    if (payload.event === 'ORDER_MARCHADO' && payload.pedido) {
                        addOrder(payload.pedido);

                        const audio = new Audio('/sounds/new-order.mp3');
                        audio.play().catch(error => {
                            console.warn('Playback blocked by browser:', error);
                        });
                    } else if (payload.event === 'ORDER_READY' && payload.pedido) {
                        removeOrder(payload.pedido.id);
                    } else if (payload.event === 'TABLE_CLOSED' && typeof payload.mesa_id === 'number') {
                        removeTable(payload.mesa_id);
                    }
                } catch (error) {
                    console.error('Error parsing WS message:', error);
                }
            };

            socket.onclose = () => {
                if (disposed) return;
                console.log('KDS WebSocket disconnected');
                setConnected(false);
                retryId = window.setTimeout(connect, 5000);
            };

            socket.onerror = () => {
                console.warn('WebSocket KDS: conexion fallida');
                socket?.close();
            };
        };

        connect();

        return () => {
            disposed = true;
            if (retryId) window.clearTimeout(retryId);
            socket?.close();
        };
    }, [addOrder, fetchActiveOrders, removeOrder, removeTable, setConnected]);
};
