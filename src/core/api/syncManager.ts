import { offlineStore } from './offlineStore';
import { useNetworkStore } from '../state/networkStore';
import { logger } from '../logger/logger';

let listenersInitialized = false;

/**
 * SUME DOCBLOCK
 * Nombre: Sync Manager
 * Tipo: Background Service
 * 
 * Entradas:
 * - Cola de peticiones en Outbox (offlineStore)
 * - Estado de red (navigator.onLine)
 * 
 * Acciones:
 * - processOutbox: Itera sobre las peticiones pendientes e intenta enviarlas
 * - Si fuesen exitosas, se elimina la orden del Outbox. Si fallan de nuevo, se detiene para evitar desorden.
 * - initializeSyncListeners: Configura hooks al evento 'online' del SO.
 * 
 * Salidas:
 * - Backend actualizado al restaurarse la conexión
 * 
 * Dependencias:
 * - offlineStore
 * - networkStore
 * - native fetch (para evitar dependencias cíclicas con apiClient)
 */

export const syncManager = {
    async processOutbox() {
        const networkStore = useNetworkStore.getState();
        
        // 1. Actualizar contador inicial
        const outboxCount = (await offlineStore.getPendingOutbox()).length;
        const failedOutboxCount = await offlineStore.getFailedOutboxCount();
        networkStore.setPendingSyncs(outboxCount);
        networkStore.setFailedSyncs(failedOutboxCount);

        if (networkStore.isSyncing) {
            logger.info('Sincronización ya en curso');
            return;
        }

        const outbox = await offlineStore.getPendingOutbox();
        if (outbox.length === 0) {
            return;
        }

        logger.info(`Iniciando sincronización: ${outbox.length} elementos pendientes.`);
        networkStore.setSyncingStatus(true);

        const token = localStorage.getItem('comandero_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

        for (const req of outbox) {
            try {
                logger.info(`Sincronizando: [${req.method}] ${req.endpoint} (ID: ${req.id})`);
                
                const response = await fetch(`${BASE_URL}${req.endpoint}`, {
                    method: req.method,
                    headers: {
                        ...headers,
                        'X-Idempotency-Key': req.idempotencyKey || req.id
                    },
                    body: JSON.stringify(req.body)
                });

                if (response.ok) {
                    await offlineStore.removeOutboxItem(req.id);
                    logger.info(`Elemento sincronizado: ${req.id}`);
                } else if (response.status === 401) {
                     logger.error('Sesión inválida al intentar sincronizar. Abortando proceso.');
                     window.location.href = '/login';
                     break; 
                } else if (response.status >= 400 && response.status < 500) {
                    // Errores 4xx (Client Error): El servidor rechaza la petición por lógica
                    // IMPORTANTE: Si la petición está mal, no la reintentamos infinitamente.
                    // La sacamos de la cola normal pero deberíamos logearla/persistirla como "Fallida".
                    logger.error(`Error de lógica al sincronizar ${req.id} (Status: ${response.status}). Saltando elemento.`);
                    const errorText = await response.text().catch(() => '');
                    await offlineStore.markOutboxItemFailed(
                        req.id,
                        errorText || `HTTP ${response.status}`
                    );
                } else {
                    // Errores 5xx (Server Error): Posible caída temporal, paramos para reintentar luego
                    logger.error(`Error temporal del servidor al sincronizar ${req.id} (Status: ${response.status})`);
                    break; 
                }
            } catch (error) {
                // Fallo de red (fetch falló antes de tener status)
                logger.error('Conexión perdida durante sincronización', error);
                break;
            }
        }

        // 2. Actualizar contador final
        const finalCount = (await offlineStore.getPendingOutbox()).length;
        const finalFailedCount = await offlineStore.getFailedOutboxCount();
        networkStore.setPendingSyncs(finalCount);
        networkStore.setFailedSyncs(finalFailedCount);
        networkStore.setSyncingStatus(false);
        logger.info('Proceso de sincronización finalizado');
    },

    initializeSyncListeners() {
        if (typeof window !== 'undefined') {
            if (listenersInitialized) {
                return;
            }
            listenersInitialized = true;

            window.addEventListener('online', () => {
                logger.info('Conexión restaurada - disparando sincronización en background');
                useNetworkStore.getState().setOnlineStatus(true);
                this.processOutbox();
            });
            
            window.addEventListener('offline', () => {
                useNetworkStore.getState().setOnlineStatus(false);
            });

            // Chequeo preventivo al iniciar app por si hay cosas en cola
            setTimeout(() => this.processOutbox(), 2000);
        }
    }
};
