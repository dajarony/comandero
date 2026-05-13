import { get, set } from 'idb-keyval';
import { useNetworkStore } from '../state/networkStore';
import { logger } from '../logger/logger';

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

/**
 * SUME DOCBLOCK
 * Nombre: Offline Store
 * Tipo: Logic Block (Persistencia)
 * 
 * Entradas:
 * - Datos oxigenados de la API (mesas, menu)
 * - Peticiones fallidas (Outbox)
 * 
 * Acciones:
 * - setCacheData: Guarda un JSON en la caché local 
 * - getCacheData: Retorna un JSON de la caché local
 * - enqueueRequest: Añade una petición HTTP fallida a una cola FIFO
 * - getOutbox: Obtiene la cola entera de peticiones
 * - clearOutbox: Vacia la cola tras sincronizar
 * 
 * Salidas:
 * - Datos persistidos en IndexedDB del navegador
 * 
 * Dependencias:
 * - idb-keyval
 * - networkStore
 */

export interface OutboxRequest {
    id: string;
    idempotencyKey: string;
    method: string;      // POST, PUT, DELETE
    endpoint: string;    // url
    body: JsonValue | null;
    timestamp: number;   // Fecha de creación offline
    status: 'pending' | 'failed';
    attempts: number;
    lastError?: string;
}

function updateSyncCounters(outbox: OutboxRequest[]): void {
    const networkStore = useNetworkStore.getState();
    networkStore.setPendingSyncs(outbox.filter(item => item.status === 'pending').length);
    networkStore.setFailedSyncs(outbox.filter(item => item.status === 'failed').length);
}

export const offlineStore = {
    // -----------------------------------------------------
    // CACHÉ DE LECTURA (Tablas maestras)
    // -----------------------------------------------------
    async setCacheData<T>(key: string, data: T): Promise<void> {
        try {
            await set(`cache_${key}`, data);
        } catch (error) {
            logger.error(`Error guardando cache para ${key}`, error);
        }
    },

    async getCacheData<T>(key: string): Promise<T | null> {
        try {
            const data = await get(`cache_${key}`);
            return data as T || null;
        } catch (error) {
            logger.error(`Error leyendo cache para ${key}`, error);
            return null;
        }
    },

    // -----------------------------------------------------
    // OUTBOX (Cola de escrituras para Sincronización)
    // -----------------------------------------------------
    async enqueueRequest(
        method: string,
        endpoint: string,
        body: JsonValue | null,
        idempotencyKey: string = crypto.randomUUID(),
    ): Promise<OutboxRequest> {
        try {
            const currentOutbox: OutboxRequest[] = await get('sync_outbox') || [];
            const id = crypto.randomUUID();
            const newRequest: OutboxRequest = {
                id,
                idempotencyKey,
                method,
                endpoint,
                body,
                timestamp: Date.now(),
                status: 'pending',
                attempts: 0
            };
            
            const newOutbox = [...currentOutbox, newRequest];
            await set('sync_outbox', newOutbox);
            
            // Actualizar contador en UI
            updateSyncCounters(newOutbox);
            logger.info(`Peticion encolada para sincronizacion: ${endpoint}`);
            return newRequest;
            
        } catch (error) {
            logger.error(`Error encolando peticion para sincronizacion`, error);
            throw error;
        }
    },

    async getOutbox(): Promise<OutboxRequest[]> {
        return await get('sync_outbox') || [];
    },

    async getPendingOutbox(): Promise<OutboxRequest[]> {
        const outbox = await this.getOutbox();
        return outbox.filter(item => item.status === 'pending');
    },

    async clearOutbox(): Promise<void> {
        await set('sync_outbox', []);
        updateSyncCounters([]);
    },
    
    async removeOutboxItem(id: string): Promise<void> {
       const currentOutbox = await this.getOutbox();
       const filteredOutbox = currentOutbox.filter(item => item.id !== id);
       await set('sync_outbox', filteredOutbox);
       updateSyncCounters(filteredOutbox);
    },

    async markOutboxItemFailed(id: string, lastError: string): Promise<void> {
       const currentOutbox = await this.getOutbox();
       const updatedOutbox = currentOutbox.map(item =>
           item.id === id
               ? {
                   ...item,
                   status: 'failed' as const,
                   attempts: (item.attempts ?? 0) + 1,
                   lastError
               }
               : item
       );
       await set('sync_outbox', updatedOutbox);
       updateSyncCounters(updatedOutbox);
    },

    async getOutboxCount(): Promise<number> {
        const outbox = await this.getOutbox();
        return outbox.length;
    },

    async getFailedOutboxCount(): Promise<number> {
        const outbox = await this.getOutbox();
        return outbox.filter(item => item.status === 'failed').length;
    }
};
