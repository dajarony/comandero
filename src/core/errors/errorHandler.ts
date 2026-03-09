import { logger } from '../logger/logger';

export function handleError(error: unknown, context: string) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] ${msg}`, error);

    // Here we could also send to Sentry or another error tracking service
}
