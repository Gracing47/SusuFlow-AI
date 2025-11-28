import retry from 'async-retry';
import { logger } from './logger';

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string = 'operation',
    options = {}
): Promise<T> {
    return retry(
        async (bail, attempt) => {
            try {
                return await fn();
            } catch (error: any) {
                // Don't retry certain errors
                if (error.code === 'NONCE_EXPIRED' ||
                    error.code === 'INSUFFICIENT_FUNDS' ||
                    error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                    logger.warn(`⚠️ Non-retryable error in ${context}:`, error.message);
                    bail(error);
                    return;
                }

                logger.warn(`⚠️ Attempt ${attempt} failed for ${context}:`, error.message);
                throw error;
            }
        },
        {
            retries: Number(process.env.MAX_RETRY_ATTEMPTS) || 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 10000,
            ...options
        }
    );
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
