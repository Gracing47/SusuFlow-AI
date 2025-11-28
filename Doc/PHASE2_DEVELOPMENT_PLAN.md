# Phase 2: NoahAI Agent - Development Plan 🤖

**Status:** 🚀 Ready to Start  
**Duration:** 1 Day (8-10 hours)  
**Prerequisites:** ✅ Phase 1 Complete (Contracts deployed to Alfajores)  
**Date:** 2025-11-28

---

## 📋 Quick Overview

**Goal:** Build an autonomous AI agent that monitors SusuFlow pools and automates:
- ✅ Payment reminders (console logs for MVP)
- ✅ Automatic payout triggers when conditions are met
- ✅ Pool health monitoring and alerting

**Tech Stack:**
- Node.js 18+ with TypeScript
- ethers.js v6 for blockchain interaction
- Winston for logging
- node-cron for scheduled tasks

---

## 🎯 Success Criteria

Before you mark Phase 2 complete you MUST have:

- [ ] Agent running stably for 2+ hours
- [ ] Successfully triggered at least 1 payout on Alfajores
- [ ] Reminders logged for missing payments
- [ ] Handles RPC disconnects gracefully
- [ ] Clean, structured console logs with timestamps
- [ ] README.md in `/agent` directory

---

## 📂 Project Structure

```
agent/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── eventListener.ts         # Blockchain event monitoring
│   ├── poolMonitor.ts           # Pool state tracking
│   ├── decisionEngine.ts        # AI decision logic
│   ├── notificationService.ts   # Logging & notifications
│   ├── types.ts                 # TypeScript interfaces
│   └── utils/
│       ├── logger.ts            # Winston setup
│       └── retry.ts             # Retry logic
├── abis/
│   ├── SusuFactory.json         # Factory ABI
│   └── SusuPool.json            # Pool ABI
├── logs/                        # Auto-generated logs
├── .env                         # Environment config
├── .env.example                 # Template
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Step-by-Step Implementation

### Step 1: Project Setup (30 minutes)

**1.1 Initialize Project**
```bash
cd c:\Users\blexx\Desktop\Code\SusuFlow-AI
mkdir agent
cd agent
npm init -y
```

**1.2 Install Dependencies**
```bash
npm install ethers@^6.9.0 dotenv@^16.3.1 winston@^3.11.0 node-cron@^3.0.3 async-retry@^1.3.3
npm install -D typescript@^5.3.0 @types/node@^20.10.0 ts-node@^10.9.2 nodemon@^3.0.2 prettier@^3.1.0
```

**1.3 Configure TypeScript**
```bash
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**1.4 Update package.json scripts**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --exec ts-node src/index.ts",
    "start": "node dist/index.js",
    "clean": "rm -rf dist"
  }
}
```

**1.5 Create Environment Configuration**

Create `.env.example`:
```env
# Blockchain
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
FACTORY_ADDRESS=
PRIVATE_KEY=

# Agent Configuration
SCAN_INTERVAL_MINUTES=5
REMINDER_HOURS_BEFORE=24
MAX_GAS_PRICE_GWEI=5

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/agent.log
```

Then: `cp .env.example .env` and fill in values from Phase 1 deployment.

**1.6 Copy Contract ABIs**
```bash
mkdir abis
cp ../contracts/out/SusuFactory.sol/SusuFactory.json ./abis/
cp ../contracts/out/SusuPool.sol/SusuPool.json ./abis/
```

**✅ Checkpoint:** Run `npm run build` - should compile without errors.

---

### Step 2: Utilities & Types (45 minutes)

**2.1 Create `src/utils/logger.ts`**
```typescript
import winston from 'winston';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 7
    })
  ]
});
```

**2.2 Create `src/utils/retry.ts`**
```typescript
import retry from 'async-retry';
import { logger } from './logger';

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options = {}
): Promise<T> {
  return retry(
    async (bail, attempt) => {
      try {
        return await fn();
      } catch (error: any) {
        if (error.code === 'NONCE_EXPIRED') {
          bail(error); // Don't retry nonce errors
          return;
        }
        logger.warn(`Attempt ${attempt} failed:`, error.message);
        throw error;
      }
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      ...options
    }
  );
}
```

**2.3 Create `src/types.ts`**
```typescript
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
  factoryAddress: string;
  privateKey: string;
  scanIntervalMinutes: number;
  reminderHoursBefore: number;
  maxGasPriceGwei: number;
}
```

**✅ Checkpoint:** `npm run build` should succeed.

---

### Step 3: Event Listener (1.5 hours)

**Create `src/eventListener.ts`**

Key responsibilities:
- Connect to Celo blockchain
- Monitor Factory for new pools
- Monitor Pools for contributions and events
- Automatic reconnection on failure

```typescript
import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { retryWithBackoff } from './utils/retry';
import FactoryABI from '../abis/SusuFactory.json';
import PoolABI from '../abis/SusuPool.json';

export class EventListener {
  private provider!: ethers.WebSocketProvider;
  private factoryContract!: ethers.Contract;
  private poolContracts: Map<string, ethers.Contract> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private rpcUrl: string,
    private factoryAddress: string
  ) {}

  async initialize(): Promise<void> {
    logger.info('🔌 Connecting to Celo blockchain...');

    await retryWithBackoff(async () => {
      this.provider = new ethers.WebSocketProvider(this.rpcUrl);
      await this.provider.ready;
    });

    this.factoryContract = new ethers.Contract(
      this.factoryAddress,
      FactoryABI.abi,
      this.provider
    );

    // Setup reconnection handler
    this.setupReconnection();

    logger.info('✅ Connected to blockchain');
  }

  private setupReconnection(): void {
    this.provider.websocket.on('close', async () => {
      logger.warn('⚠️ WebSocket disconnected. Attempting to reconnect...');
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.initialize();
      } else {
        logger.error('❌ Max reconnection attempts reached. Exiting...');
        process.exit(1);
      }
    });

    this.provider.websocket.on('open', () => {
      this.reconnectAttempts = 0;
      logger.info('✅ WebSocket reconnected');
    });
  }

  async listenToFactory(): Promise<void> {
    logger.info('👂 Listening to Factory events...');

    this.factoryContract.on('PoolCreated', async (poolAddress, creator, event) => {
      logger.info('🆕 New pool created!', {
        pool: poolAddress,
        creator,
        txHash: event.log.transactionHash
      });

      await this.listenToPool(poolAddress);
    });
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
  }

  async getFactoryContract(): Promise<ethers.Contract> {
    return this.factoryContract;
  }

  async getPoolContract(address: string): Promise<ethers.Contract | undefined> {
    return this.poolContracts.get(address);
  }

  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down event listener...');
    await this.provider.destroy();
  }
}
```

**✅ Checkpoint:** Build should succeed. Test connection by running temporarily.

---

### Step 4: Pool Monitor (1.5 hours)

**Create `src/poolMonitor.ts`**

Key responsibilities:
- Track state of all pools
- Identify actionable conditions (payout ready, reminders needed)
- Query blockchain on-demand

```typescript
import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { PoolState, ActionableCondition } from './types';
import PoolABI from '../abis/SusuPool.json';

export class PoolMonitor {
  private pools: Map<string, PoolState> = new Map();

  constructor(private provider: ethers.Provider) {}

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
      const [
        contributionAmount,
        cycleDuration,
        currentRound,
        nextPayoutTime,
        isActive
      ] = await contract.getPoolInfo();

      const memberCount = await contract.getMemberCount();
      const members: string[] = [];

      for (let i = 0; i < Number(memberCount); i++) {
        const member = await contract.members(i);
        members.push(member);
      }

      // Get missing contributors
      const missingContributors = await contract.getMissingContributors();

      const contributionsThisCycle = new Map<string, bigint>();
      for (const member of members) {
        const contributed = await contract.hasContributed(member, currentRound);
        if (contributed) {
          contributionsThisCycle.set(member, contributionAmount);
        }
      }

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

      // Refresh state
      await this.refreshPoolState(address);
      const updatedPool = this.pools.get(address)!;

      // Check if payout is ready
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

      // Check if reminders should be sent
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

      // Check if pool is stalled
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
    }

    return conditions;
  }

  private isPayoutReady(pool: PoolState, now: number): boolean {
    // Payout is ready if:
    // 1. Time has passed
    // 2. All members have contributed
    return now >= pool.nextPayoutTime && 
           this.getMissingContributors(pool).length === 0;
  }

  private shouldSendReminders(pool: PoolState, now: number): boolean {
    const reminderHours = Number(process.env.REMINDER_HOURS_BEFORE) || 24;
    const reminderTime = pool.nextPayoutTime - (reminderHours * 3600);
    
    return now >= reminderTime && now < pool.nextPayoutTime;
  }

  private isPoolStalled(pool: PoolState, now: number): boolean {
    // Pool is stalled if payout time has passed but not ready
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
```

**✅ Checkpoint:** Build succeeds, types are correct.

---

### Step 5: Decision Engine (1 hour)

**Create `src/decisionEngine.ts`**

Key responsibilities:
- Process actionable conditions
- Trigger blockchain transactions (payouts)
- Send notifications

```typescript
import { ethers } from 'ethers';
import { logger } from './utils/logger';
import { retryWithBackoff } from './utils/retry';
import { ActionableCondition } from './types';
import { NotificationService } from './notificationService';
import PoolABI from '../abis/SusuPool.json';

export class DecisionEngine {
  private wallet: ethers.Wallet;
  private notificationService: NotificationService;
  private processedActions = new Set<string>();

  constructor(
    private provider: ethers.Provider,
    privateKey: string
  ) {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.notificationService = new NotificationService();
  }

  async processActions(conditions: ActionableCondition[]): Promise<void> {
    logger.info(`🤔 Processing ${conditions.length} actionable condition(s)...`);

    for (const condition of conditions) {
      const actionId = `${condition.type}-${condition.poolAddress}`;

      // Prevent duplicate processing
      if (this.processedActions.has(actionId)) {
        continue;
      }

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
          await this.notificationService.logWarning(
            `Pool stalled: ${condition.poolAddress}`,
            condition.details
          );
          break;
      }

      this.processedActions.add(actionId);

      // Clean up after 1 hour
      setTimeout(() => this.processedActions.delete(actionId), 3600000);
    }
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
          'TBD', // Will be extracted from event
          0n,
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
```

---

### Step 6: Notification Service (30 minutes)

**Create `src/notificationService.ts`**

```typescript
import { logger } from './utils/logger';
import { ethers } from 'ethers';

export class NotificationService {
  async sendReminder(
    userAddress: string,
    poolAddress: string,
    contributionAmount: bigint,
    dueDate: Date
  ): Promise<void> {
    logger.info('🔔 REMINDER SENT', {
      user: userAddress,
      pool: poolAddress,
      amount: ethers.formatUnits(contributionAmount, 18),
      dueDate: dueDate.toISOString(),
      timestamp: new Date().toISOString()
    });
  }

  async notifyPayout(
    poolAddress: string,
    recipient: string,
    amount: bigint,
    txHash: string
  ): Promise<void> {
    logger.info('💸 PAYOUT EXECUTED', {
      pool: poolAddress,
      recipient,
      amount: ethers.formatUnits(amount, 18),
      transaction: txHash,
      timestamp: new Date().toISOString()
    });
  }

  async logWarning(message: string, metadata: any): Promise<void> {
    logger.warn(message, metadata);
  }
}
```

---

### Step 7: Main Orchestrator (1 hour)

**Create `src/index.ts`**

```typescript
import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import { EventListener } from './eventListener';
import { PoolMonitor } from './poolMonitor';
import { DecisionEngine } from './decisionEngine';
import { logger } from './utils/logger';
import { ethers } from 'ethers';

class NoahAIAgent {
  private eventListener!: EventListener;
  private poolMonitor!: PoolMonitor;
  private decisionEngine!: DecisionEngine;
  private cronJob!: cron.ScheduledTask;
  private provider!: ethers.Provider;

  async start(): Promise<void> {
    logger.info('🤖 Starting NoahAI Agent...');

    // Validate environment
    this.validateConfig();

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL!);

    // Initialize components
    this.eventListener = new EventListener(
      process.env.CELO_RPC_URL!.replace('https', 'wss'),
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
```

**✅ Checkpoint:** Full build should succeed.

---

### Step 8: README & Documentation (30 minutes)

**Create `agent/README.md`**

```markdown
# NoahAI Agent for SusuFlow

Autonomous AI agent that monitors and manages SusuFlow ROSCA pools on Celo.

## Features

- 🔍 Real-time blockchain event monitoring
- 🔔 Payment reminders for pool members
- ⚡ Automatic payout triggering
- 🛡️ Graceful error handling and reconnection
- 📊 Comprehensive logging

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Build:
   ```bash
   npm run build
   ```

4. Run:
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

## Environment Variables

- `CELO_RPC_URL` - Celo RPC endpoint (wss:// for WebSocket)
- `FACTORY_ADDRESS` - Deployed SusuFactory address
- `PRIVATE_KEY` - Wallet private key (for triggering payouts)
- `SCAN_INTERVAL_MINUTES` - How often to scan pools (default: 5)
- `REMINDER_HOURS_BEFORE` - When to send reminders before payout (default: 24)

## Logs

Logs are saved to `./logs/` directory:
- `combined.log` - All logs
- `error.log` - Only errors

## Architecture

- **EventListener**: Monitors blockchain events
- **PoolMonitor**: Tracks pool states
- **DecisionEngine**: Makes decisions and triggers actions
- **NotificationService**: Sends notifications (console logs for MVP)

## Testing

Deploy a test pool on Alfajores and watch the agent detect it in real-time!
```

---

## 🧪 Testing & Validation

### Local Testing

1. **Start the agent in dev mode:**
   ```bash
   npm run dev
   ```

2. **In another terminal, interact with testnet:**
   - Create a pool using the frontend or Foundry scripts
   - Make contributions
   - Watch agent console for events

3. **Verify agent behavior:**
   - ✅ Detects new pools
   - ✅ Logs contributions
   - ✅ Sends reminders at right time
   - ✅ Triggers payout when ready

### Integration Test Scenario

**Scenario: Full Pool Cycle**

1. Create pool with 3 members, 1 day cycle
2. All 3 members join
3. 2 members contribute immediately
4. Wait 23 hours → Agent should send reminder to 3rd member
5. 3rd member contributes
6. Wait 1 more hour → Agent should trigger payout

**Expected Logs:**
```
✅ New pool created: 0x...
✅ Member joined: 0xA
✅ Member joined: 0xB
✅ Member joined: 0xC
💰 Contribution from 0xA
💰 Contribution from 0xB
🔔 REMINDER: 0xC - payment due in 1 hour
💰 Contribution from 0xC
⚡ Triggering payout for pool 0x...
✅ Payout distributed! TxHash: 0x...
```

---

## 📦 Deliverables Checklist

Before marking Phase 2 complete:

- [ ] All TypeScript files created and compile without errors
- [ ] `.env` configured with Alfajores values
- [ ] Contract ABIs copied to `abis/` folder
- [ ] `npm run dev` starts agent successfully
- [ ] Agent connects to blockchain and loads pools
- [ ] README.md created with setup instructions
- [ ] Tested with at least 1 live pool on Alfajores
- [ ] Successfully triggered 1 payout (can be test pool)
- [ ] Logs are clear and show all events
- [ ] Code committed to Git with message "feat: Phase 2 - NoahAI Agent complete"

---

## 🚀 Next Steps (Phase 3)

Once Phase 2 is complete:
- [ ] **Report back** with agent console screenshot showing events
- [ ] Share Alfajores transaction where agent triggered payout
- [ ] Move to Phase 3: Frontend development

---

## 💡 Troubleshooting

**Agent won't start:**
- Check `.env` file exists and has all values
- Verify RPC URL is accessible
- Check private key format (should start with 0x)

**No events detected:**
- Ensure factory address is correct
- Verify WebSocket RPC URL (wss:// not https://)
- Check if pools exist on testnet

**Payout transaction fails:**
- Ensure wallet has testnet CELO for gas
- Verify pool meets payout conditions (time + contributions)
- Check gas price settings

---

**Duration:** This should take 8-10 hours for a focused developer.

**Remember:** Keep it simple! The goal is a working demo, not production perfection.

Good luck! 🚀
