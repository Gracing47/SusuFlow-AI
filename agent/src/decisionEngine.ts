import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { ActionableCondition } from './types';
import { NotificationService } from './notificationService';
import PoolABI from '../abis/SusuPool.json';

export class DecisionEngine {
    private wallet: ethers.Wallet;
    private notificationService: NotificationService;
    private processedActions = new Set<string>();

    constructor(
        provider: ethers.Provider,
        privateKey: string
    ) {
        this.wallet = new ethers.Wallet(privateKey, provider);
        this.notificationService = new NotificationService();
    }

    async processActions(conditions: ActionableCondition[]): Promise<void> {
        if (conditions.length === 0) return;

        logger.info(`🤔 Processing ${conditions.length} actionable condition(s)...`);

        for (const condition of conditions) {
            // Create unique ID for this action to prevent duplicates
            // For reminders: ID includes date/hour to allow daily reminders
            // For payouts: ID is round specific
            const actionId = this.createActionId(condition);

            // Prevent duplicate processing
            if (this.processedActions.has(actionId)) {
                continue;
            }

            try {
                switch (condition.type) {
                    case 'PAYOUT_READY':
                        await this.triggerPayout(condition.poolAddress);
                        break;

                    case 'REMINDER_DUE':
                        await this.sendReminders(
                            condition.poolAddress,
                            condition.details.missingContributors || []
                        );
                        break;

                    case 'POOL_STALLED':
                        await this.notificationService.alertPoolStalled(
                            condition.poolAddress,
                            condition.details.hoursOverdue || 0,
                            condition.details.missingContributors || []
                        );
                        break;
                }

                this.processedActions.add(actionId);

                // Clean up ID after 24 hours (to allow next cycle/day actions)
                setTimeout(() => this.processedActions.delete(actionId), 24 * 3600 * 1000);

            } catch (error: any) {
                logger.error(`Failed to process action ${condition.type} for ${condition.poolAddress}:`, error);
            }
        }
    }

    private createActionId(condition: ActionableCondition): string {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `${condition.type}-${condition.poolAddress}-${date}`;
    }

    private async triggerPayout(poolAddress: string): Promise<void> {
        logger.info(`⚡ Attempting to trigger payout for pool: ${poolAddress}`);

        const poolContract = new ethers.Contract(
            poolAddress,
            PoolABI.abi,
            this.wallet
        );

        try {
            // Estimate gas first
            const estimatedGas = await poolContract.distributePot.estimateGas();
            const gasWithBuffer = (estimatedGas * 120n) / 100n; // 20% buffer

            logger.info(`💡 Estimated gas: ${estimatedGas.toString()}`);

            // Send transaction
            const tx = await poolContract.distributePot({
                gasLimit: gasWithBuffer
            });

            logger.info(`📤 Transaction sent: ${tx.hash}`);
            logger.info(`⏳ Waiting for confirmation...`);

            const receipt = await tx.wait(1);

            if (receipt.status === 1) {
                logger.info(`✅ Payout triggered successfully!`, {
                    pool: poolAddress,
                    txHash: receipt.hash,
                    gasUsed: receipt.gasUsed.toString()
                });

                await this.notificationService.notifyPayout(
                    poolAddress,
                    'Cycle Winner', // In real app, we'd parse logs to get winner
                    0n, // We'd parse logs to get amount
                    receipt.hash
                );
            } else {
                logger.error(`❌ Transaction failed`, { txHash: tx.hash });
            }

        } catch (error: any) {
            logger.error(`Failed to trigger payout for ${poolAddress}:`, error.message);

            // Check if it's a revert
            if (error.reason) {
                logger.error(`Revert reason: ${error.reason}`);
            }
        }
    }

    private async sendReminders(
        poolAddress: string,
        missingMembers: string[]
    ): Promise<void> {
        logger.info(`🔔 Sending reminders for pool: ${poolAddress}`);

        for (const member of missingMembers) {
            await this.notificationService.sendReminder(
                member,
                poolAddress,
                0n, // Will fetch from pool state
                new Date()
            );
        }

        logger.info(`✅ Sent ${missingMembers.length} reminder(s)`);
    }
}
