import { toast } from 'react-hot-toast';
import { logger } from '../logger/logger';

/**
 * @module errorHandler
 * @description Centraliza la captura de errores, traduce códigos técnicos a mensajes amigables y los muestra en la UI.
 */

interface ApiError {
    status?: number;
    message?: string;
    name?: string;
}

export function handleError(error: unknown, context: string) {
    const err = error as ApiError;
    let userMessage = 'Ha ocurrido un error inesperado';

    // 1. Detección de errores conocidos
    if (err.status) {
        switch (err.status) {
            case 401:
                userMessage = 'Tu sesión ha expirado. Por favor, entra de nuevo.';
                break;
            case 403:
                userMessage = 'No tienes permiso para hacer esto.';
                break;
            case 404:
                userMessage = 'No se encontró la información solicitada.';
                break;
            case 422:
                userMessage = 'Hay un error en los datos enviados. Revisa el formulario.';
                break;
            case 500:
                userMessage = 'Error en el servidor. Lo estamos revisando.';
                break;
            default:
                userMessage = err.message || userMessage;
        }
    } else if (err.name === 'TypeError' || !navigator.onLine) {
        // Errores de red se manejan con un tono tranquilo
        userMessage = 'Trabajando sin conexión. Tus cambios se enviarán al volver el WiFi.';
        
        // No mostramos Toast de error para desconexión habitual si es modo offline soportado,
        // pero sí un aviso informativo si el usuario intenta una acción pesada.
        toast.success(userMessage, { icon: '📡', duration: 4000 });
        logger.warn(`[${context}] Offline Mode triggered.`);
        return;
    }

    // 2. Log para desarrollo
    logger.error(`[${context}] ${err.message || String(error)}`, error);

    // 3. Notificación visual al usuario
    toast.error(userMessage, {
        id: `err-${context}`, // Evitar duplicados del mismo contexto
        duration: 5000
    });
}
