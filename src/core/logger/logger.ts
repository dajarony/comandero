export const logger = {
    info: (msg: string, data?: any) => console.log(msg, data),
    warn: (msg: string, data?: any) => console.warn(msg, data),
    error: (msg: string, data?: any) => console.error(msg, data)
};
