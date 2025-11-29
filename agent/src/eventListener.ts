import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { retryWithBackoff } from './utils/retry';
import FactoryABI from '../abis/SusuFactory.json';
import PoolABI from '../abis/SusuPool.json';

export class EventListener {
    private provider!: ethers.JsonRpcProvider;
    private factoryContract!: ethers.Contract;
    private poolContracts: Map<string, ethers.Contract> = new Map();
    private lastBlockChecked: number = 0;
    private isPolling: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
    private onNewPoolCallback?: (poolAddress: string) => Promise<void>;

    constructor(
        private rpcUrl: string,
        private factoryAddress: string
    ) { }

    setNewPoolCallback(callback: (poolAddress: string) => Promise<void>): void {
        this.onNewPoolCallback = callback;
    }

    async initialize(): Promise<void> {
        logger.info(`🔌 Connecting to Celo blockchain (HTTP Polling)...`);

        await retryWithBackoff(async () => {
            this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            const network = await this.provider.getNetwork();
            logger.info(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

            // Initialize last block checked to current block
            this.lastBlockChecked = await this.provider.getBlockNumber();
            logger.info(`🏁 Starting event monitoring from block: ${this.lastBlockChecked}`);
        }, 'blockchain connection');

        this.factoryContract = new ethers.Contract(
            this.factoryAddress,
            FactoryABI.abi,
            this.provider
        );

        // Pool loading will be handled by the main agent
        // This ensures proper coordination with PoolMonitor

        // Start the polling loop
        this.startPolling();
    }

    private startPolling(): void {
        if (this.isPolling) return;
        this.isPolling = true;

        logger.info('🔄 Starting event polling loop...');

        this.pollInterval = setInterval(async () => {
            try {
                await this.pollEvents();
            } catch (error: any) {
                logger.error('❌ Error during event polling:', error.message);
            }
        }, this.POLL_INTERVAL_MS);
    }

    private async pollEvents(): Promise<void> {
        try {
            // Increase lag to 5 blocks to avoid "block out of range" errors
            const BLOCK_LAG = 5;
            const currentBlock = await this.provider.getBlockNumber() - BLOCK_LAG;

            // If no new blocks, skip
            if (currentBlock <= this.lastBlockChecked) return;

            // Process blocks in chunks if gap is too large (max 100 blocks)
            const MAX_BLOCK_RANGE = 100;
            const fromBlock = this.lastBlockChecked + 1;
            const toBlock = Math.min(currentBlock, fromBlock + MAX_BLOCK_RANGE);

            // 1. Check Factory Events
            await this.checkFactoryEvents(fromBlock, toBlock);

            // 2. Check Pool Events
            await this.checkPoolEvents(fromBlock, toBlock);

            // Update checkpoint only if successful
            this.lastBlockChecked = toBlock;

        } catch (error: any) {
            // If we fail, we don't update lastBlockChecked, so we'll retry next time
            logger.error('⚠️ Failed to poll events (will retry):', error.message);
        }
    }

    private async checkFactoryEvents(fromBlock: number, toBlock: number): Promise<void> {
        // Let errors bubble up to pollEvents so we don't advance block number on failure
        const events = await this.factoryContract.queryFilter('PoolCreated', fromBlock, toBlock);

        for (const event of events) {
            if (event instanceof ethers.EventLog) {
                const { pool, creator } = event.args;
                logger.info('🆕 New pool created!', {
                    pool,
                    creator,
                    txHash: event.transactionHash,
                    block: event.blockNumber
                });

                // Register new pool for event listening
                await this.listenToPool(pool);

                // Notify main agent via callback
                if (this.onNewPoolCallback) {
                    await this.onNewPoolCallback(pool);
                }
            }
        }
    }

    private async checkPoolEvents(fromBlock: number, toBlock: number): Promise<void> {
        // Iterate through all monitored pools
        for (const [address, contract] of this.poolContracts) {
            try {
                // Query all relevant events for this pool
                const events = await contract.queryFilter('*', fromBlock, toBlock);

                for (const event of events) {
                    if (event instanceof ethers.EventLog) {
                        await this.handlePoolEvent(address, event);
                    }
                }
            } catch (error: any) {
                // If it's a block range error, rethrow it to stop the polling loop and retry later
                if (error.message?.includes('block is out of range') || error.code === -32019) {
                    throw error;
                }
                // Otherwise, log warning for this specific pool but continue with others
                logger.warn(`Failed to query events for pool ${address}: ${error.message}`);
            }
        }
    }

    private async handlePoolEvent(poolAddress: string, event: ethers.EventLog): Promise<void> {
        const eventName = event.eventName;
        const args = event.args;

        switch (eventName) {
            case 'MemberJoined':
                logger.info('👥 Member joined pool', {
                    pool: poolAddress,
                    member: args[0],
                    txHash: event.transactionHash
                });
                break;

            case 'ContributionMade':
                logger.info('💰 Contribution made', {
                    pool: poolAddress,
                    member: args[0],
                    amount: ethers.formatUnits(args[1], 18),
                    round: args[2].toString(),
                    txHash: event.transactionHash
                });
                break;

            case 'PayoutDistributed':
                logger.info('✅ Payout distributed', {
                    pool: poolAddress,
                    recipient: args[0],
                    amount: ethers.formatUnits(args[1], 18),
                    round: args[2].toString(),
                    txHash: event.transactionHash
                });
                break;
        }
    }

    async listenToFactory(): Promise<void> {
        // In polling mode, this just logs intent, actual polling happens in pollEvents
        logger.info('👂 Monitoring Factory for new pools...');
    }

    async listenToPool(poolAddress: string): Promise<void> {
        if (this.poolContracts.has(poolAddress)) return;

        const poolContract = new ethers.Contract(
            poolAddress,
            PoolABI.abi,
            this.provider
        );

        this.poolContracts.set(poolAddress, poolContract);
        logger.info(`📡 Added pool to monitor: ${poolAddress}`);
    }

    async getFactoryContract(): Promise<ethers.Contract> {
        return this.factoryContract;
    }

    async getPoolContract(address: string): Promise<ethers.Contract | undefined> {
        return this.poolContracts.get(address);
    }

    async shutdown(): Promise<void> {
        logger.info('🛑 Shutting down event listener...');
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
    }
}
