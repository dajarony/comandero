import { offlineStore } from './offlineStore';
import { useNetworkStore } from '../state/networkStore';
import { logger } from '../logger/logger';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
let listenersInitialized = false;
let syncing = false;

export const syncManager = {
    async processOutbox() {
        const token = localStorage.getItem('comandero_token');
        if (syncing || !token) return;
        syncing = true;
        const network = useNetworkStore.getState();
        try {
            const queued = await offlineStore.getOutbox();
            const pending = queued.filter(item => item.status === 'pending');
            network.setPendingSyncs(pending.length);
            network.setFailedSyncs(queued.length - pending.length);
            if (!pending.length) return;
            network.setSyncingStatus(true);

            for (const request of pending) {
                if (localStorage.getItem('comandero_token') !== token) break;
                const response = await fetch(BASE_URL + request.endpoint, {
                    method: request.method,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                        'X-Idempotency-Key': request.idempotencyKey || request.id,
                    },
                    body: JSON.stringify(request.body),
                });

                if (response.ok) {
                    await offlineStore.removeOutboxItem(request.id);
                    continue;
                }

                if (response.status === 401) {
                    if (localStorage.getItem('comandero_token') === token) {
                        localStorage.removeItem('comandero_token');
                        localStorage.removeItem('comandero_user');
                        window.location.href = '/login';
                    }
                    break;
                }
                if (response.status === 408 || response.status === 429 || response.status >= 500) break;
                const json = await response.json().catch(() => ({})) as { error?: string; detail?: unknown };
                const reason = json.error || (typeof json.detail === 'string' ? json.detail : 'El servidor rechazó este envío.');
                await offlineStore.markOutboxItemFailed(request.id, reason);
            }
        } catch (error) {
            logger.warn('La sincronización continuará en el siguiente intento.', error);
        } finally {
            syncing = false;
            network.setSyncingStatus(false);
        }
    },

    initializeSyncListeners() {
        if (listenersInitialized) return;
        listenersInitialized = true;
        const run = () => { void this.processOutbox(); };
        window.addEventListener('online', run);
        window.setTimeout(run, 1000);
        window.setInterval(run, 5000);
    },
};
