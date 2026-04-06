/**
 * @module KitchenPage
 * @description Pantalla principal del KDS (Kitchen Display System).
 */
import React, { useEffect } from 'react';
import { useKitchenStore } from '../state/kitchenStore';
import { useKitchenSocket } from '../hooks/useKitchenSocket';
import { KitchenCard } from './KitchenCard';
import styles from './KitchenPage.module.css';
import { BottomNav } from '@/shared/components/BottomNav';

export const KitchenPage: React.FC = () => {
    const { orders, fetchActiveOrders, isConnected, isLoading } = useKitchenStore();
    
    // Activar conexión de tiempo real
    useKitchenSocket();

    useEffect(() => {
        fetchActiveOrders();
    }, [fetchActiveOrders]);

    // Fondo oscuro en body para evitar espacio blanco al hacer scroll
    useEffect(() => {
        document.body.style.backgroundColor = '#0d1117';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    if (isLoading && orders.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <h2>Cargando Cocina...</h2>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header con indicadores de estado */}
            <header className={styles.header}>
                <div className={styles.logoGroup}>
                  <span className={styles.badge}>KDS</span>
                  <h1>PANTALLA DE COCINA</h1>
                </div>
                
                <div className={styles.statusGroup}>
                  <div className={`${styles.statusIndicator} ${isConnected ? styles.online : styles.offline}`}>
                      {isConnected ? '📡 TIEMPO REAL ACTIVO' : '❌ DESCONECTADO'}
                  </div>
                  <div className={styles.orderCount}>
                      {orders.length} pedidos activos
                  </div>
                </div>
            </header>

            {/* Grid de Comandas */}
            <main className={styles.grid}>
                {orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👨‍🍳</div>
                        <h3>No hay pedidos pendientes</h3>
                        <p>Las nuevas comandas aparecerán aquí automáticamente.</p>
                    </div>
                ) : (
                    orders.map((pedido) => (
                        <KitchenCard key={pedido.id} pedido={pedido} />
                    ))
                )}
            </main>
            <BottomNav />
        </div>
    );
};
