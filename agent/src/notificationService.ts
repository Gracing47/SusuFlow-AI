import { logger } from './utils/logger';
import { ethers } from 'ethers';

export class NotificationService {
    private async sendTelegramMessage(message: string): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) return;

        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            if (!response.ok) {
                logger.error('Failed to send Telegram message', await response.text());
            }
        } catch (error) {
            logger.error('Error sending Telegram message:', error);
        }
    }

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
        const message = `🔔 <b>Payment Reminder</b>\n\nUser: <code>${userAddress}</code>\nPool: <code>${poolAddress}</code>\nDue: ${dueDate.toLocaleString()}`;

        logger.info('🔔 REMINDER SENT', {
            user: userAddress,
            pool: poolAddress,
            amount: ethers.formatUnits(contributionAmount, 18) + ' cUSD',
            dueDate: dueDate.toISOString(),
            timestamp: new Date().toISOString()
        });

        await this.sendTelegramMessage(message);
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
        const explorerLink = `https://alfajores.celoscan.io/tx/${txHash}`;
        const message = `💸 <b>Payout Executed!</b>\n\nPool: <code>${poolAddress}</code>\nWinner: <code>${recipient}</code>\nAmount: <b>${ethers.formatUnits(amount, 18)} cUSD</b>\n\n<a href="${explorerLink}">View Transaction</a>`;

        logger.info('💸 PAYOUT EXECUTED', {
            pool: poolAddress,
            recipient,
            amount: ethers.formatUnits(amount, 18) + ' cUSD',
            transaction: txHash,
            timestamp: new Date().toISOString(),
            explorerLink
        });

        await this.sendTelegramMessage(message);
    }

    /**
     * Log system warnings
     */
    async logWarning(message: string, metadata: any): Promise<void> {
        logger.warn(`⚠️ ${message}`, metadata);
        await this.sendTelegramMessage(`⚠️ <b>System Warning</b>\n\n${message}\n<code>${JSON.stringify(metadata)}</code>`);
    }

    /**
     * Log pool stalled alert
     */
    async alertPoolStalled(
        poolAddress: string,
        hoursOverdue: number,
        missingContributors: string[]
    ): Promise<void> {
        const message = `⏰ <b>Pool Stalled Alert</b>\n\nPool: <code>${poolAddress}</code>\nOverdue: <b>${hoursOverdue.toFixed(1)} hours</b>\nMissing Payments: ${missingContributors.length}`;

        logger.warn('⏰ POOL STALLED', {
            pool: poolAddress,
            hoursOverdue: hoursOverdue.toFixed(2),
            missingMembers: missingContributors.length,
            members: missingContributors,
            message: `Pool is ${hoursOverdue.toFixed(1)} hours overdue with ${missingContributors.length} missing payment(s)`
        });

        await this.sendTelegramMessage(message);
    }
}
