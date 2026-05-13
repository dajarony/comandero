/**
 * @module logger
 * @description Logger centralizado del frontend (wrapper sobre console)
 * SUME Docblock v2.0
 * Entradas : msg (string), data opcional
 * Lógica   : delega a console.log/warn/error
 * Salidas  : void (side effect: console output)
 */
export const logger = {
    info: (msg: string, data?: unknown) => console.log(msg, data),
    warn: (msg: string, data?: unknown) => console.warn(msg, data),
    error: (msg: string, data?: unknown) => console.error(msg, data),
};
