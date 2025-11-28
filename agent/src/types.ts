export interface PoolState {
    address: string;
    currentRound: number;
    nextPayoutTime: number;
    contributionAmount: bigint;
    members: string[];
    contributionsThisCycle: Map<string, bigint>;
    hasReceivedPayout: Map<string, boolean>;
    isActive: boolean;
    lastChecked: number;
}

export interface ActionableCondition {
    poolAddress: string;
    type: 'REMINDER_DUE' | 'PAYOUT_READY' | 'POOL_STALLED';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    details: {
        missingContributors?: string[];
        potAmount?: bigint;
        hoursOverdue?: number;
    };
}

export interface Config {
    celoRpcUrl: string;
    celoWsRpcUrl: string;
    factoryAddress: string;
    privateKey: string;
    scanIntervalMinutes: number;
    reminderHoursBefore: number;
    maxGasPriceGwei: number;
}

export interface PoolCreatedEvent {
    poolAddress: string;
    creator: string;
    event: any;
}

export interface ContributionEvent {
    member: string;
    amount: bigint;
    round: number;
    event: any;
}
