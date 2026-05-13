import React from 'react';
import { useNetworkStore } from '@/core/state/networkStore';
import { syncManager } from '@/core/api/syncManager';
import styles from './NetworkStatus.module.css';

/**
 * SUME DOCBLOCK
 * Nombre: Network Status Indicator
 * Tipo: UI Component
 * 
 * Entradas: useNetworkStore (isOnline, isSyncing, pendingSyncs)
 * Lógica: Selecciona el color y texto basado en el estado de red.
 * Salidas: JSX con el indicador de estado (Verde, Naranja o Azul).
 */
export const NetworkStatus: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncs, failedSyncs } = useNetworkStore();

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnline && !isSyncing) {
      syncManager.processOutbox();
    }
  };

  if (isSyncing) {
    return (
      <div className={`${styles.badge} ${styles.syncing}`} title="Sincronizando datos con el servidor">
        <div className={styles.dot} />
        <span>Guardando...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`${styles.badge} ${styles.offline}`} title="Sin conexión. Los pedidos se guardarán localmente.">
        <div className={styles.dot} />
        <span>Sin Conexión</span>
        {failedSyncs > 0 && (
          <span className={styles.pendingBadge}>{failedSyncs} fallidos</span>
        )}
        {pendingSyncs > 0 && failedSyncs === 0 && (
          <span className={styles.pendingBadge}>{pendingSyncs} pendientes</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.badge} ${styles.online}`} title="Conexión estable con el servidor">
      <div className={styles.dot} />
      <span>Conectado</span>
      {failedSyncs > 0 && (
        <span className={styles.pendingBadge}>{failedSyncs} fallidos</span>
      )}
      {pendingSyncs > 0 && (
        <button 
          className={styles.syncBtn} 
          onClick={handleSync}
          title="Sincronizar pedidos pendientes"
        >
          <span>{pendingSyncs}</span>
          <svg viewBox="0 0 24 24" className={styles.syncIcon} fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};
