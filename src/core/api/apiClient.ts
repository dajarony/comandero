/**
 * ═══════════════════════════════════════════════════════
 * Archivo: core/api/apiClient.ts
 * Tipo: Infraestructura → Cliente HTTP Centralizado
 * 
 * Responsabilidades:
 * - Wrapper sobre fetch con base URL del backend
 * - Inyección automática de JWT en cada request
 * - Unwrap de ApiResponse<T> del backend
 * - Manejo de errores 401 (redirect a login)
 * ═══════════════════════════════════════════════════════
 */

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

/**
 * Realiza una petición HTTP al backend.
 * - Añade Authorization header si hay token
 * - Parsea la respuesta como ApiResponse<T>
 * - Redirige a /login en caso de 401/403
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Auth expirado o no autorizado → redirect a login
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('comandero_token');
        localStorage.removeItem('comandero_user');
        window.location.href = '/login';
        throw new ApiError(response.status, 'Sesión expirada');
    }

    const json = await response.json();

    if (!response.ok) {
        throw new ApiError(
            response.status,
            json.message || json.detail || 'Error del servidor',
        );
    }

    // El backend envuelve todo en { success, data, message }
    // Retornamos solo data
    return (json as ApiResponse<T>).data ?? json;
}

/** Métodos del cliente API */
export const apiClient = {
    get: <T>(endpoint: string) => request<T>(endpoint),

    post: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T>(endpoint: string) =>
        request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse };
