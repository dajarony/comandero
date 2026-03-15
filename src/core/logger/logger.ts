export const logger = {
    info: (msg: string, data?: unknown) => console.log(msg, data),
    warn: (msg: string, data?: unknown) => console.warn(msg, data),
    error: (msg: string, data?: unknown) => console.error(msg, data),
};
