import { get, set, update } from 'idb-keyval';
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
    owner?: number;
}

export function offlineSession(): { id?: number; modo?: string } {
    try {
        return JSON.parse(localStorage.getItem('comandero_user') ?? 'null') ?? {};
    } catch {
        return {};
    }
}

function currentRequests(outbox: OutboxRequest[]): OutboxRequest[] {
    const session = offlineSession();
    if (session.id === undefined) return [];
    return outbox.filter(item => item.owner === session.id || (item.owner === undefined && session.modo !== 'COMANDERO'));
}

function updateSyncCounters(outbox: OutboxRequest[]): void {
    const networkStore = useNetworkStore.getState();
    const visible = currentRequests(outbox);
    networkStore.setPendingSyncs(visible.filter(item => item.status === 'pending').length);
    networkStore.setFailedSyncs(visible.filter(item => item.status === 'failed').length);
}

async function changeOutbox(change: (outbox: OutboxRequest[]) => OutboxRequest[]): Promise<void> {
    await update<OutboxRequest[]>('sync_outbox', outbox => change(outbox ?? []));
    updateSyncCounters(await get<OutboxRequest[]>('sync_outbox') ?? []);
}

export const offlineStore = {
    // -----------------------------------------------------
    // CACHÉ DE LECTURA (Tablas maestras)
    // -----------------------------------------------------
    async setCacheData<T>(key: string, data: T, owner = offlineSession().id): Promise<void> {
        try {
            await set(`cache_${owner ?? 'public'}_${key}`, data);
        } catch (error) {
            logger.error(`Error guardando cache para ${key}`, error);
        }
    },

    async getCacheData<T>(key: string, owner = offlineSession().id): Promise<T | null> {
        try {
            const data = await get(`cache_${owner ?? 'public'}_${key}`);
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
        owner = offlineSession().id,
    ): Promise<OutboxRequest> {
        try {
            const id = crypto.randomUUID();
            const newRequest: OutboxRequest = {
                id,
                idempotencyKey,
                method,
                endpoint,
                body,
                timestamp: Date.now(),
                status: 'pending',
                attempts: 0,
                owner,
            };
            
            await changeOutbox(outbox => [...outbox, newRequest]);
            logger.info(`Peticion encolada para sincronizacion: ${endpoint}`);
            return newRequest;
            
        } catch (error) {
            logger.error(`Error encolando peticion para sincronizacion`, error);
            throw error;
        }
    },

    async getOutbox(): Promise<OutboxRequest[]> {
        return currentRequests(await get<OutboxRequest[]>('sync_outbox') ?? []);
    },

    async getPendingOutbox(): Promise<OutboxRequest[]> {
        const outbox = await this.getOutbox();
        return outbox.filter(item => item.status === 'pending');
    },

    async clearOutbox(): Promise<void> {
        await changeOutbox(outbox => {
            const ids = new Set(currentRequests(outbox).map(item => item.id));
            return outbox.filter(item => !ids.has(item.id));
        });
    },
    
    async removeOutboxItem(id: string): Promise<void> {
       await changeOutbox(outbox => outbox.filter(item => item.id !== id));
    },

    async markOutboxItemFailed(id: string, lastError: string): Promise<void> {
       await changeOutbox(outbox => outbox.map(item =>
           item.id === id
               ? {
                   ...item,
                   status: 'failed' as const,
                   attempts: (item.attempts ?? 0) + 1,
                   lastError
               }
               : item
       ));
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
