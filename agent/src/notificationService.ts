import { logger } from './utils/logger';
import { ethers } from 'ethers';

export class NotificationService {
    /**
     * Send payment reminder notification
     * MVP: Console logs only
     * Future: Telegram, Email, SMS
     */
    async sendReminder(
        userAddress: string,
        poolAddress: string,
        contributionAmount: bigint,
        dueDate: Date
    ): Promise<void> {
        logger.info('🔔 REMINDER SENT', {
            user: userAddress,
            pool: poolAddress,
            amount: ethers.formatUnits(contributionAmount, 18) + ' cUSD',
            dueDate: dueDate.toISOString(),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Notify about successful payout
     */
    async notifyPayout(
        poolAddress: string,
        recipient: string,
        amount: bigint,
        txHash: string
    ): Promise<void> {
        logger.info('💸 PAYOUT EXECUTED', {
            pool: poolAddress,
            recipient,
            amount: ethers.formatUnits(amount, 18) + ' cUSD',
            transaction: txHash,
            timestamp: new Date().toISOString(),
            explorerLink: `https://alfajores.celoscan.io/tx/${txHash}`
        });
    }

    /**
     * Log system warnings
     */
    async logWarning(message: string, metadata: any): Promise<void> {
        logger.warn(`⚠️ ${message}`, metadata);
    }

    /**
     * Log pool stalled alert
     */
    async alertPoolStalled(
        poolAddress: string,
        hoursOverdue: number,
        missingContributors: string[]
    ): Promise<void> {
        logger.warn('⏰ POOL STALLED', {
            pool: poolAddress,
            hoursOverdue: hoursOverdue.toFixed(2),
            missingMembers: missingContributors.length,
            members: missingContributors,
            message: `Pool is ${hoursOverdue.toFixed(1)} hours overdue with ${missingContributors.length} missing payment(s)`
        });
    }
}
