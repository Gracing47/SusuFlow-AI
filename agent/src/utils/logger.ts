import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Console output with colors
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length
                        ? '\n' + JSON.stringify(meta, null, 2)
                        : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })
            )
        }),
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 7
        })
    ]
});

// Add a special method for agent status logging
export function logAgentStatus(status: string, details?: any): void {
    logger.info(`🤖 ${status}`, details || {});
}

// Log startup banner
export function logStartupBanner(): void {
    console.log('\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     NoahAI Agent for SusuFlow          ║');
    console.log('║     Autonomous ROSCA Management        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n');
}
