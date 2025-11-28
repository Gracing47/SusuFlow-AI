import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { PoolState, ActionableCondition } from './types';
import PoolABI from '../abis/SusuPool.json';

export class PoolMonitor {
    private pools: Map<string, PoolState> = new Map();

    constructor(private provider: ethers.Provider) { }

    async addPool(poolAddress: string): Promise<void> {
        if (this.pools.has(poolAddress)) {
            return;
        }

        await this.refreshPoolState(poolAddress);
        logger.info(`📊 Added pool to monitoring: ${poolAddress}`);
    }

    async refreshPoolState(poolAddress: string): Promise<PoolState> {
        const contract = new ethers.Contract(poolAddress, PoolABI.abi, this.provider);

        try {
            // Fetch core pool info
            const [
                contributionAmount,
                , // cycleDuration (unused)
                currentRound,
                nextPayoutTime,
                isActive
            ] = await contract.getPoolInfo();

            // Fetch members
            const memberCount = await contract.getMemberCount();
            const members: string[] = [];

            for (let i = 0; i < Number(memberCount); i++) {
                const member = await contract.members(i);
                members.push(member);
            }

            // Check contributions for current cycle
            const contributionsThisCycle = new Map<string, bigint>();
            for (const member of members) {
                const contributed = await contract.hasContributed(member, currentRound);
                if (contributed) {
                    contributionsThisCycle.set(member, contributionAmount);
                }
            }

            // Check payout status
            const hasReceivedPayout = new Map<string, boolean>();
            for (const member of members) {
                const received = await contract.hasReceivedPayout(member);
                hasReceivedPayout.set(member, received);
            }

            const state: PoolState = {
                address: poolAddress,
                currentRound: Number(currentRound),
                nextPayoutTime: Number(nextPayoutTime),
                contributionAmount: BigInt(contributionAmount),
                members,
                contributionsThisCycle,
                hasReceivedPayout,
                isActive,
                lastChecked: Date.now()
            };

            this.pools.set(poolAddress, state);
            return state;

        } catch (error: any) {
            logger.error(`Failed to refresh pool ${poolAddress}:`, error.message);
            throw error;
        }
    }

    async scanForActions(): Promise<ActionableCondition[]> {
        const conditions: ActionableCondition[] = [];
        const now = Math.floor(Date.now() / 1000);

        for (const [address, pool] of this.pools.entries()) {
            if (!pool.isActive) continue;

            // Refresh state to be sure
            try {
                await this.refreshPoolState(address);
                const updatedPool = this.pools.get(address)!;

                // 1. Check if payout is ready
                if (this.isPayoutReady(updatedPool, now)) {
                    conditions.push({
                        poolAddress: address,
                        type: 'PAYOUT_READY',
                        priority: 'HIGH',
                        details: {
                            potAmount: updatedPool.contributionAmount * BigInt(updatedPool.members.length)
                        }
                    });
                }

                // 2. Check if reminders should be sent
                else if (this.shouldSendReminders(updatedPool, now)) {
                    const missing = this.getMissingContributors(updatedPool);

                    if (missing.length > 0) {
                        conditions.push({
                            poolAddress: address,
                            type: 'REMINDER_DUE',
                            priority: 'MEDIUM',
                            details: {
                                missingContributors: missing
                            }
                        });
                    }
                }

                // 3. Check if pool is stalled (overdue)
                else if (this.isPoolStalled(updatedPool, now)) {
                    const hoursOverdue = (now - updatedPool.nextPayoutTime) / 3600;

                    conditions.push({
                        poolAddress: address,
                        type: 'POOL_STALLED',
                        priority: 'LOW',
                        details: {
                            hoursOverdue,
                            missingContributors: this.getMissingContributors(updatedPool)
                        }
                    });
                }
            } catch (err) {
                logger.error(`Error scanning pool ${address}:`, err);
            }
        }

        return conditions;
    }

    private isPayoutReady(pool: PoolState, now: number): boolean {
        const allContributed = this.getMissingContributors(pool).length === 0;
        return now >= pool.nextPayoutTime && allContributed;
    }

    private shouldSendReminders(pool: PoolState, now: number): boolean {
        const reminderHours = Number(process.env.REMINDER_HOURS_BEFORE) || 24;
        const reminderTime = pool.nextPayoutTime - (reminderHours * 3600);
        return now >= reminderTime && now < pool.nextPayoutTime;
    }

    private isPoolStalled(pool: PoolState, now: number): boolean {
        return now > pool.nextPayoutTime &&
            this.getMissingContributors(pool).length > 0;
    }

    private getMissingContributors(pool: PoolState): string[] {
        return pool.members.filter(member => !pool.contributionsThisCycle.has(member));
    }

    getPoolCount(): number {
        return this.pools.size;
    }

    getAllPools(): PoolState[] {
        return Array.from(this.pools.values());
    }
}
