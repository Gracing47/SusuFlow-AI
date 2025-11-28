import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import { EventListener } from './eventListener';
import { PoolMonitor } from './poolMonitor';
import { DecisionEngine } from './decisionEngine';
import { logger, logStartupBanner } from './utils/logger';
import { ethers } from 'ethers';

class NoahAIAgent {
    private eventListener!: EventListener;
    private poolMonitor!: PoolMonitor;
    private decisionEngine!: DecisionEngine;
    private cronJob!: cron.ScheduledTask;
    private provider!: ethers.Provider;

    async start(): Promise<void> {
        logStartupBanner();
        logger.info('🤖 Starting NoahAI Agent...');

        // Validate environment
        this.validateConfig();

        // Initialize provider
        const rpcUrl = process.env.CELO_RPC_URL!;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        // Initialize components
        // Use WebSocket for events if available, otherwise HTTP
        const wsUrl = process.env.CELO_WS_RPC_URL || rpcUrl.replace('https', 'wss');

        this.eventListener = new EventListener(
            wsUrl,
            process.env.FACTORY_ADDRESS!
        );

        this.poolMonitor = new PoolMonitor(this.provider);

        this.decisionEngine = new DecisionEngine(
            this.provider,
            process.env.PRIVATE_KEY!
        );

        // Start event listening
        await this.eventListener.initialize();
        await this.eventListener.listenToFactory();

        // Load existing pools
        await this.loadExistingPools();

        // Start cron job
        this.startCronJob();

        logger.info('✅ NoahAI Agent started successfully!');
        logger.info(`📊 Monitoring ${this.poolMonitor.getPoolCount()} pool(s)`);
    }

    private validateConfig(): void {
        const required = ['CELO_RPC_URL', 'FACTORY_ADDRESS', 'PRIVATE_KEY'];

        for (const key of required) {
            if (!process.env[key]) {
                throw new Error(`Missing required environment variable: ${key}`);
            }
        }
    }

    private async loadExistingPools(): Promise<void> {
        logger.info('🔍 Loading existing pools...');

        const factoryContract = await this.eventListener.getFactoryContract();

        try {
            // Get all pools (pagination: start=0, limit=100)
            // Note: In production, we'd need to handle pagination properly
            const poolAddresses = await factoryContract.getAllPools(0, 100);

            logger.info(`Found ${poolAddresses.length} existing pool(s)`);

            for (const address of poolAddresses) {
                await this.poolMonitor.addPool(address);
                await this.eventListener.listenToPool(address);
            }

        } catch (error: any) {
            logger.error('Failed to load existing pools:', error.message);
        }
    }

    private startCronJob(): void {
        const intervalMinutes = Number(process.env.SCAN_INTERVAL_MINUTES) || 5;
        const schedule = `*/${intervalMinutes} * * * *`;

        logger.info(`⏰ Starting cron job (every ${intervalMinutes} minutes)...`);

        this.cronJob = cron.schedule(schedule, async () => {
            logger.info('🔍 Running scheduled pool scan...');

            try {
                const conditions = await this.poolMonitor.scanForActions();

                if (conditions.length > 0) {
                    logger.info(`Found ${conditions.length} actionable condition(s)`);
                    await this.decisionEngine.processActions(conditions);
                } else {
                    logger.info('No actions needed at this time');
                }

            } catch (error: any) {
                logger.error('Error during scheduled scan:', error.message);
            }
        });
    }

    async shutdown(): Promise<void> {
        logger.info('🛑 Shutting down NoahAI Agent...');

        if (this.cronJob) {
            this.cronJob.stop();
        }

        await this.eventListener.shutdown();

        logger.info('👋 Goodbye!');
        process.exit(0);
    }
}

// Create and start agent
const agent = new NoahAIAgent();

agent.start().catch((error) => {
    logger.error('Fatal error starting agent:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());
