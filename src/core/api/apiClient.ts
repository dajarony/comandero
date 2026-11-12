/**
 * @module apiClient
 * @description Cliente HTTP centralizado con JWT y soporte Offline/Outbox
 * SUME Docblock v2.0
 * Entradas : endpoint (string), options (RequestInit)
 * Lógica   : fetch + offline caching + outbox fallback para mutaciones + JWT
 * Salidas  : Promise<T> con datos desenvueltos
 */

import { offlineSession, offlineStore, type JsonValue } from './offlineStore';
import { logger } from '../logger/logger';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/** Respuesta estándar del backend */
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/** Obtiene el token JWT de localStorage */
function getToken(): string | null {
    return localStorage.getItem('comandero_token');
}

/** Lanza error con mensaje del backend o genérico */
class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

function parseRequestBody(body: BodyInit | null | undefined): JsonValue | null {
    if (!body || typeof body !== 'string') return null;
    return JSON.parse(body) as JsonValue;
}

function createMutationOptions(method: 'POST' | 'PUT' | 'DELETE', body?: unknown): RequestInit {
    const idempotencyKey = crypto.randomUUID();

    return {
        method,
        headers: {
            'X-Idempotency-Key': idempotencyKey,
        },
        body: body ? JSON.stringify(body) : undefined,
    };
}

/**
 * Realiza una petición HTTP al backend con manejo Offline Integrado.
 * - Añade Authorization header si hay token
 * - Si hay internet: cachea GETs
 * - Si no hay internet: devuelve GETs de caché o encola las mutaciones (Outbox)
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    queueOffline = true,
): Promise<T> {
    const token = getToken();
    const owner = offlineSession().id;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const method = options.method || 'GET';

    let networkFailed = false;
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers }).catch(error => {
            networkFailed = error instanceof TypeError;
            throw error;
        });

        // Auth expirado o no autorizado → redirect a login (solo si no estamos ya en /login)
        if (response.status === 401) {
            localStorage.removeItem('comandero_token');
            localStorage.removeItem('comandero_user');
            if (!window.location.href.includes('/login')) {
                window.location.href = '/login';
            }
            throw new ApiError(response.status, 'Sesión expirada');
        }

        const json = await response.json();

        if (!response.ok) {
            throw new ApiError(
                response.status,
                json.error || json.message || json.detail || 'Error del servidor',
            );
        }

        const responseData = (json as ApiResponse<T>).data ?? json;

        // Cachear las respuestas GET exitosas para usarlas si se cae el WiFi
        if (method === 'GET') {
            await offlineStore.setCacheData(endpoint, responseData, owner);
        }

        return responseData as T;

    } catch (error: unknown) {
        if (networkFailed) {
            logger.warn(`Conexión fallida intentando ${method} ${endpoint}. Fallback a Offline Store.`);

            if (method === 'GET') {
                // Modo Lectura: Recuperar de caché
                const cachedData = await offlineStore.getCacheData<T>(endpoint, owner);
                if (cachedData) {
                     logger.info(`Devolviendo caché para ${endpoint}`);
                     return cachedData;
                }
                throw new Error('Sin conexión y sin datos en caché para mostrar.');
            } else if (queueOffline) {
                // Modo Escritura: Guardar en Outbox para enviar más tarde
                const parsedBody = parseRequestBody(options.body);
                const idempotencyKey = headers['X-Idempotency-Key'] || crypto.randomUUID();
                const queuedRequest = await offlineStore.enqueueRequest(method, endpoint, parsedBody, idempotencyKey, owner);
                
                // Retornar éxito optimista para que la UI no se bloquee ni muestre error
                // simulamos un ID temporal si es necesario para crear localmente
                return {
                    _offlineQueued: true,
                    _optimistic: true,
                    id: `temp-${queuedRequest.id}`,
                    outboxId: queuedRequest.id
                } as unknown as T;
            } else throw new Error('Sin conexión. Vuelve a intentarlo cuando se recupere.');
        }

        // Si es otro tipo de error (ej. 400 Bad request), lo lanzamos normal
        throw error;
    }
}

/** Métodos del cliente API */
export const apiClient = {
    get: <T>(endpoint: string) => request<T>(endpoint),

    post: <T>(endpoint: string, body?: unknown, queueOffline = true) =>
        request<T>(endpoint, createMutationOptions('POST', body), queueOffline),

    put: <T>(endpoint: string, body?: unknown, queueOffline = true) =>
        request<T>(endpoint, createMutationOptions('PUT', body), queueOffline),

    delete: <T>(endpoint: string) =>
        request<T>(endpoint, createMutationOptions('DELETE')),
};

export { ApiError };
export type { ApiResponse };
