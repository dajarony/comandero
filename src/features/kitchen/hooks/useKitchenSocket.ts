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
}

export const useKitchenSocket = () => {
    const { addOrder, setConnected } = useKitchenStore();

    useEffect(() => {
        let socket: WebSocket | undefined;
        let retryId: number | undefined;

        const connect = () => {
            const token = localStorage.getItem('comandero_token');
            if (!token) return;

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/kitchen';

            socket = new WebSocket(wsUrl, ['comandero-jwt', token]);

            socket.onopen = () => {
                console.log('KDS WebSocket connected');
                setConnected(true);
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
                    }
                } catch (error) {
                    console.error('Error parsing WS message:', error);
                }
            };

            socket.onclose = () => {
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
            if (retryId) window.clearTimeout(retryId);
            socket?.close();
        };
    }, [addOrder, setConnected]);
};
