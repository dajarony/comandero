/**
 * @module KitchenCard
 * @description Tarjeta individual de pedido para la cocina.
 */
import React, { useState, useEffect } from 'react';
import type { PedidoApi } from '@/features/order/api/orderApi';
import { useKitchenStore } from '../state/kitchenStore';
import styles from './KitchenCard.module.css';

interface KitchenCardProps {
  pedido: PedidoApi;
}

export const KitchenCard: React.FC<KitchenCardProps> = ({ pedido }) => {
  const { markAsReady } = useKitchenStore();
  const [elapsed, setElapsed] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular tiempo transcurrido
  useEffect(() => {
    const start = new Date(pedido.created_at).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pedido.created_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determinar nivel de urgencia visual
  const getUrgencyClass = () => {
    if (elapsed > 600) return styles.critical; // > 10 min
    if (elapsed > 300) return styles.warning;  // > 5 min
    return styles.normal;
  };

  const handleReady = async () => {
    setIsProcessing(true);
    await markAsReady(pedido.id);
    setIsProcessing(false);
  };

  return (
    <div className={`${styles.card} ${getUrgencyClass()}`}>
      <header className={styles.cardHeader}>
        <div className={styles.mesaGroup}>
           <span className={styles.mesaPrefix}>MESA</span>
           <span className={styles.mesaNumber}>{pedido.mesa_numero || pedido.mesa_id}</span>
        </div>
        <div className={styles.timer}>
            {formatTime(elapsed)}
        </div>
      </header>

      <div className={styles.content}>
        <ul className={styles.itemList}>
          {pedido.lineas.map((linea) => (
            <li key={linea.id} className={styles.item}>
              <div className={styles.itemRow}>
                <span className={styles.quantity}>{linea.cantidad}x</span>
                <span className={styles.itemName}>{linea.item_nombre}</span>
              </div>
              {linea.nota && (
                <div className={styles.note}>
                  <span className={styles.noteIcon}>💬</span>
                  {linea.nota}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.cardFooter}>
         <button 
           className={styles.readyButton} 
           onClick={handleReady}
           disabled={isProcessing}
         >
           {isProcessing ? 'Procesando...' : '¡LISTO! ✅'}
         </button>
      </footer>
    </div>
  );
};
