import { create } from 'zustand';

/**
 * SUME DOCBLOCK
 * Nombre: Network Store
 * Tipo: Zustand Store
 * 
 * Entradas:
 * - Eventos del navegador `online` / `offline`
 * - Estados de sync del SyncManager
 * 
 * Acciones:
 * - Mantiene estado global de conexión a internet
 * - Controla banderas visuales de sincronización
 * - Contabiliza transacciones pendientes en outbox
 * 
 * Salidas:
 * - isOnline: boolean
 * - isSyncing: boolean
 * - pendingSyncs: number
 */

interface NetworkState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingSyncs: number;
    failedSyncs: number;
    
    // Mutaciones
    setOnlineStatus: (status: boolean) => void;
    setSyncingStatus: (status: boolean) => void;
    setPendingSyncs: (count: number) => void;
    setFailedSyncs: (count: number) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
    // Optimistic default: asume online. navigator.onLine es poco fiable en Capacitor Android.
    isOnline: true,
    isSyncing: false,
    pendingSyncs: 0,
    failedSyncs: 0,
    
    setOnlineStatus: (status) => set({ isOnline: status }),
    setSyncingStatus: (status) => set({ isSyncing: status }),
    setPendingSyncs: (count) => set({ pendingSyncs: count }),
    setFailedSyncs: (count) => set({ failedSyncs: count }),
}));

// Listeners globales para mantener el store sincronizado con el SO
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useNetworkStore.getState().setOnlineStatus(true);
    });
    window.addEventListener('offline', () => {
        useNetworkStore.getState().setOnlineStatus(false);
    });
}
