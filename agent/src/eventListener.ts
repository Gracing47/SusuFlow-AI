import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { retryWithBackoff } from './utils/retry';
import FactoryABI from '../abis/SusuFactory.json';
import PoolABI from '../abis/SusuPool.json';

export class EventListener {
    private provider!: ethers.WebSocketProvider | ethers.JsonRpcProvider;
    private factoryContract!: ethers.Contract;
    private poolContracts: Map<string, ethers.Contract> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isWebSocket = false;

    constructor(
        private rpcUrl: string,
        private factoryAddress: string
    ) {
        this.isWebSocket = rpcUrl.startsWith('wss') || rpcUrl.startsWith('ws');
    }

    async initialize(): Promise<void> {
        logger.info(`🔌 Connecting to Celo blockchain (${this.isWebSocket ? 'WebSocket' : 'HTTP'})...`);

        await retryWithBackoff(async () => {
            if (this.isWebSocket) {
                this.provider = new ethers.WebSocketProvider(this.rpcUrl);
                // Wait for ready
                await (this.provider as ethers.WebSocketProvider).ready;
            } else {
                this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            }
        }, 'blockchain connection');

        this.factoryContract = new ethers.Contract(
            this.factoryAddress,
            FactoryABI.abi,
            this.provider
        );

        // Setup reconnection handler only for WebSocket
        if (this.isWebSocket) {
            this.setupReconnection();
        }

        logger.info('✅ Connected to blockchain');
    }

    private setupReconnection(): void {
        if (!this.provider || !(this.provider instanceof ethers.WebSocketProvider)) return;

        (this.provider.websocket as any).on('close', async () => {
            logger.warn('⚠️ WebSocket disconnected. Attempting to reconnect...');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
                await this.initialize();
                // Re-listen to everything
                await this.listenToFactory();
                for (const address of this.poolContracts.keys()) {
                    await this.listenToPool(address);
                }
            } else {
                logger.error('❌ Max reconnection attempts reached. Exiting...');
                process.exit(1);
            }
        });

        (this.provider.websocket as any).on('open', () => {
            this.reconnectAttempts = 0;
            logger.info('✅ WebSocket reconnected');
        });
    }

    async listenToFactory(): Promise<void> {
        logger.info('👂 Listening to Factory events...');

        try {
            // Remove existing listeners to avoid duplicates
            this.factoryContract.removeAllListeners();

            this.factoryContract.on('PoolCreated', async (poolAddress, creator, event) => {
                logger.info('🆕 New pool created!', {
                    pool: poolAddress,
                    creator,
                    txHash: event.log.transactionHash
                });

                await this.listenToPool(poolAddress);
            });
        } catch (error: any) {
            logger.error('Failed to listen to factory:', error.message);
        }
    }

    async listenToPool(poolAddress: string): Promise<void> {
        if (this.poolContracts.has(poolAddress)) {
            return; // Already listening
        }

        const poolContract = new ethers.Contract(
            poolAddress,
            PoolABI.abi,
            this.provider
        );

        this.poolContracts.set(poolAddress, poolContract);

        try {
            // Listen to MemberJoined event
            poolContract.on('MemberJoined', (member, event) => {
                logger.info('👥 Member joined pool', {
                    pool: poolAddress,
                    member,
                    txHash: event.log.transactionHash
                });
            });

            // Listen to ContributionMade event
            poolContract.on('ContributionMade', (member, amount, round, event) => {
                logger.info('💰 Contribution made', {
                    pool: poolAddress,
                    member,
                    amount: ethers.formatUnits(amount, 18),
                    round: round.toString(),
                    txHash: event.log.transactionHash
                });
            });

            // Listen to PayoutDistributed event
            poolContract.on('PayoutDistributed', (recipient, amount, round, event) => {
                logger.info('✅ Payout distributed', {
                    pool: poolAddress,
                    recipient,
                    amount: ethers.formatUnits(amount, 18),
                    round: round.toString(),
                    txHash: event.log.transactionHash
                });
            });

            logger.info(`📡 Now monitoring pool: ${poolAddress}`);
        } catch (error: any) {
            logger.error(`Failed to listen to pool ${poolAddress}:`, error.message);
        }
    }

    async getFactoryContract(): Promise<ethers.Contract> {
        return this.factoryContract;
    }

    async getPoolContract(address: string): Promise<ethers.Contract | undefined> {
        return this.poolContracts.get(address);
    }

    async shutdown(): Promise<void> {
        logger.info('🛑 Shutting down event listener...');
        this.factoryContract.removeAllListeners();
        for (const contract of this.poolContracts.values()) {
            contract.removeAllListeners();
        }
        if (this.provider && this.provider instanceof ethers.WebSocketProvider) {
            await this.provider.destroy();
        }
    }
}
