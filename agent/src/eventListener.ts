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

    constructor(
        private rpcUrl: string,
        private factoryAddress: string
    ) { }

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

        // Fetch existing pools
        try {
            logger.info('📥 Fetching existing pools...');
            const pools = await this.factoryContract.getAllPools();
            logger.info(`📊 Found ${pools.length} existing pools`);

            for (const pool of pools) {
                await this.listenToPool(pool);
            }
        } catch (error: any) {
            logger.error(`❌ Failed to fetch existing pools: ${error.message}`);
        }

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
            const currentBlock = await this.provider.getBlockNumber() - 1;

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

            // Update checkpoint
            this.lastBlockChecked = toBlock;

        } catch (error: any) {
            logger.error('⚠️ Failed to poll events:', error.message);
        }
    }

    private async checkFactoryEvents(fromBlock: number, toBlock: number): Promise<void> {
        try {
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

                    // Register new pool for monitoring
                    await this.listenToPool(pool);
                }
            }
        } catch (error: any) {
            logger.warn(`Failed to query factory events: ${error.message}`);
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
                // Don't fail entire loop if one pool fails
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
