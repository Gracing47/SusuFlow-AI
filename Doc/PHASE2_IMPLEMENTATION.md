# Phase 2: NoahAI Agent - Implementation Specification

**Document Version:** 1.0  
**Author:** SusuFlow Development Team  
**Date:** 2025-11-28  
**Status:** Ready for Implementation  
**Prerequisites:** Phase 1 Smart Contracts Deployed to Alfajores

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Design](#architecture-design)
3. [Technical Requirements](#technical-requirements)
4. [Component Specifications](#component-specifications)
5. [Implementation Plan](#implementation-plan)
6. [Error Handling & Reliability](#error-handling--reliability)
7. [Performance Considerations](#performance-considerations)
8. [Security Requirements](#security-requirements)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Procedures](#deployment-procedures)
11. [Monitoring & Observability](#monitoring--observability)

---

## Executive Summary

### Objective
Develop an autonomous AI agent that monitors SusuFlow ROSCA pools on Celo blockchain, manages payment reminders, and triggers automated payouts when conditions are met. This agent serves as the core automation layer that differentiates SusuFlow from traditional savings circles.

### Business Value
- **User Retention**: Automated reminders reduce missed payments by an estimated 40-60%
- **Operational Efficiency**: Zero manual intervention required for payout distribution
- **Track Compliance**: Demonstrates NoahAI hackathon requirements
- **Scalability**: Handles up to 1000 concurrent pools with minimal infrastructure

### Success Criteria
1. ✅ Agent successfully monitors all active pools in real-time
2. ✅ Reminders sent within 24 hours of payment due date
3. ✅ Payouts triggered within 1 hour of eligibility
4. ✅ 99.9% uptime during hackathon evaluation period
5. ✅ Complete audit trail of all automated actions

---

## Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NoahAI Agent                              │
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Event      │─────▶│   Pool       │─────▶│  Decision    │  │
│  │   Listener   │      │   Monitor    │      │   Engine     │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                      │          │
│         │                      ▼                      ▼          │
│         │              ┌──────────────┐      ┌──────────────┐  │
│         │              │  Data Store  │      │ Notification │  │
│         │              │   (Memory)   │      │   Service    │  │
│         │              └──────────────┘      └──────────────┘  │
│         │                                             │          │
│         ▼                                             ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Blockchain Interface Layer                   │  │
│  │         (ethers.js + Celo RPC + Contract ABIs)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Celo Mainnet       │
                    │                      │
                    │                      │
                    │ ┌────────────────┐  │
                    │ │ SusuFactory    │  │
                    │ └────────────────┘  │
                    │ ┌────────────────┐  │
                    │ │ SusuPool[]     │  │
                    │ └────────────────┘  │
                    └──────────────────────┘
```

### Design Patterns

**1. Event-Driven Architecture**
- All blockchain state changes captured via events
- Asynchronous processing to prevent blocking
- Event replay capability for recovery scenarios

**2. Separation of Concerns**
```typescript
EventListener    → Blockchain interaction only
PoolMonitor      → Business logic and state tracking
DecisionEngine   → AI logic and action triggers
NotificationSvc  → External communication
```

**3. Fail-Safe Design**
- Idempotent operations (can safely retry)
- Circuit breaker pattern for RPC failures
- Graceful degradation when services unavailable

---

## Technical Requirements

### Runtime Environment
- **Platform:** Node.js v18.x or higher (LTS)
- **Language:** TypeScript 5.x
- **Package Manager:** npm or pnpm

### Dependencies

```json
{
  "dependencies": {
    "ethers": "^6.9.0",           // Blockchain interaction
    "dotenv": "^16.3.1",          // Environment configuration
    "winston": "^3.11.0",         // Structured logging
    "node-cron": "^3.0.3",        // Scheduled tasks
    "async-retry": "^1.3.3"       // Retry logic
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",          // Development hot-reload
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  }
}
```

### Infrastructure Requirements

**Development:**
- Local machine with 2GB+ available RAM
- Stable internet connection (for RPC calls)
- Terminal access

**Production (Hackathon Demo):**
- Cloud VM (AWS t2.micro, Google Cloud e2-micro, or similar)
- Persistent storage for logs
- Public IP (optional, for remote monitoring)

### External Services
1. **Celo RPC Provider:** Mainnet
2. **Backup RPC:** Infura/Quicknode (in case of primary failure)
3. **Notification Channel:** Console logs (MVP), Telegram API (optional)

---

## Component Specifications

### 1. Event Listener (`src/eventListener.ts`)

**Responsibility:** Monitor blockchain for contract events

**Core Functions:**

```typescript
class EventListener {
  private provider: ethers.WebSocketProvider;
  private factoryContract: ethers.Contract;
  private poolContracts: Map<string, ethers.Contract>;

  /**
   * Initialize connection to Celo blockchain
   * @throws {ConnectionError} if unable to connect to RPC
   */
  async initialize(): Promise<void>;

  /**
   * Start listening to Factory events
   * Events: PoolCreated, UserVerified
   */
  async listenToFactory(): Promise<void>;

  /**
   * Start listening to Pool events
   * Events: MemberJoined, ContributionMade, PayoutDistributed, PoolStarted
   * @param poolAddress - Address of pool to monitor
   */
  async listenToPool(poolAddress: string): Promise<void>;

  /**
   * Handle PoolCreated event
   * Actions: Register new pool, start monitoring it
   */
  private async onPoolCreated(event: PoolCreatedEvent): Promise<void>;

  /**
   * Handle ContributionMade event
   * Actions: Update pool state, check if payout ready
   */
  private async onContribution(poolAddress: string, event: ContributionEvent): Promise<void>;

  /**
   * Graceful shutdown - clean up listeners
   */
  async shutdown(): Promise<void>;
}
```

**Error Handling:**
- Automatic reconnection on WebSocket disconnect
- Event replay on missed blocks (using `queryFilter`)
- Rate limiting protection (max 100 requests/second)

**Performance:**
- Use WebSocket provider (not HTTP polling)
- Filter events by contract address to reduce noise
- Batch process multiple events if queue builds up

---

### 2. Pool Monitor (`src/poolMonitor.ts`)

**Responsibility:** Track pool states and identify actionable conditions

**Data Model:**

```typescript
interface PoolState {
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

interface ActionableCondition {
  poolAddress: string;
  type: 'REMINDER_DUE' | 'PAYOUT_READY' | 'POOL_STALLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  details: {
    missingContributors?: string[];
    potAmount?: bigint;
    hoursOverdue?: number;
  };
}
```

**Core Functions:**

```typescript
class PoolMonitor {
  private pools: Map<string, PoolState>;
  
  /**
   * Add new pool to monitoring
   * @param poolAddress - Contract address of the pool
   */
  async addPool(poolAddress: string): Promise<void>;

  /**
   * Update pool state from blockchain
   * @param poolAddress - Pool to update
   * @returns Updated state
   */
  async refreshPoolState(poolAddress: string): Promise<PoolState>;

  /**
   * Scan all pools for actionable conditions
   * Called every N minutes by cron job
   * @returns List of conditions requiring action
   */
  async scanForActions(): Promise<ActionableCondition[]>;

  /**
   * Check if pool is ready for payout
   * Conditions: time passed AND all contributed
   */
  private isPayoutReady(pool: PoolState): boolean;

  /**
   * Check if reminders should be sent
   * Criteria: 24 hours before payout time
   */
  private shouldSendReminders(pool: PoolState): boolean;

  /**
   * Identify members who haven't contributed
   */
  private getMissingContributors(pool: PoolState): string[];
}
```

**Optimization:**
- Cache pool states in memory (reduce RPC calls)
- Only query blockchain when events detected or time-based refresh
- Prioritize pools closer to payout deadlines

---

### 3. Decision Engine (`src/decisionEngine.ts`)

**Responsibility:** Determine what actions to take and when

**Decision Logic Flow:**

```
Input: ActionableCondition[]
  │
  ├─▶ PAYOUT_READY?
  │   └─▶ Verify all members contributed
  │       └─▶ Call distributePot() transaction
  │           └─▶ Log: "Payout triggered for Pool X"
  │
  ├─▶ REMINDER_DUE?
  │   └─▶ Get missing contributors
  │       └─▶ For each: Log notification
  │           └─▶ "🔔 Reminder: User Y, pool Z payment due in 24h"
  │
  └─▶ POOL_STALLED?
      └─▶ Log warning
          └─▶ "⚠️ Pool X: Overdue by N hours"
```

**Core Functions:**

```typescript
class DecisionEngine {
  private wallet: ethers.Wallet;
  private notificationService: NotificationService;

  /**
   * Process actionable conditions and execute appropriate actions
   * @param conditions - List of conditions from PoolMonitor
   */
  async processActions(conditions: ActionableCondition[]): Promise<void>;

  /**
   * Trigger payout transaction
   * @param poolAddress - Pool to trigger payout for
   * @returns Transaction hash if successful
   */
  private async triggerPayout(poolAddress: string): Promise<string>;

  /**
   * Send payment reminders
   * @param poolAddress - Pool with missing payments
   * @param missingMembers - Addresses of users who haven't paid
   */
  private async sendReminders(
    poolAddress: string, 
    missingMembers: string[]
  ): Promise<void>;

  /**
   * Estimate gas for transaction before sending
   * Prevents failed transactions due to insufficient gas
   */
  private async estimateGasWithBuffer(
    contract: ethers.Contract,
    method: string,
    params: any[]
  ): Promise<bigint>;
}
```

**Safety Checks:**
- Dry-run transactions before executing (estimateGas)
- Verify wallet has sufficient CELO for gas
- Implement transaction timeout (30 seconds max)
- Never execute same action twice (idempotency tracking)

---

### 4. Notification Service (`src/notificationService.ts`)

**Responsibility:** External communication (console logs, future: Telegram/email)

**MVP Implementation:**

```typescript
class NotificationService {
  private logger: winston.Logger;

  /**
   * Log reminder to console (MVP)
   * Future: Send to Telegram, Email, SMS
   */
  async sendReminder(
    userAddress: string,
    poolAddress: string,
    contributionAmount: bigint,
    dueDate: Date
  ): Promise<void> {
    this.logger.info('REMINDER SENT', {
      user: userAddress,
      pool: poolAddress,
      amount: ethers.formatUnits(contributionAmount, 18),
      dueDate: dueDate.toISOString(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log payout notification
   */
  async notifyPayout(
    recipient: string,
    poolAddress: string,
    amount: bigint,
    txHash: string
  ): Promise<void> {
    this.logger.info('PAYOUT EXECUTED', {
      recipient,
      pool: poolAddress,
      amount: ethers.formatUnits(amount, 18),
      transaction: txHash,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log system warnings
   */
  async logWarning(message: string, metadata: any): Promise<void> {
    this.logger.warn(message, metadata);
  }
}
```

**Production Extensions (Post-MVP):**
- Telegram Bot integration
- Email via SendGrid/AWS SES
- SMS via Twilio
- Push notifications for mobile app

---

### 5. Main Orchestrator (`src/index.ts`)

**Responsibility:** Application entry point and lifecycle management

```typescript
class NoahAIAgent {
  private eventListener: EventListener;
  private poolMonitor: PoolMonitor;
  private decisionEngine: DecisionEngine;
  private cronJob: cron.ScheduledTask;

  /**
   * Initialize all components
   */
  async start(): Promise<void> {
    // 1. Load configuration
    await this.loadConfig();

    // 2. Connect to blockchain
    await this.eventListener.initialize();

    // 3. Load existing pools from factory
    await this.loadExistingPools();

    // 4. Start event listeners
    await this.eventListener.listenToFactory();

    // 5. Start periodic monitoring (every 5 minutes)
    this.startCronJob();

    console.log('🤖 NoahAI Agent started successfully');
  }

  /**
   * Load all existing pools from factory contract
   */
  private async loadExistingPools(): Promise<void> {
    const poolAddresses = await factoryContract.getAllPools(0, 100);
    for (const address of poolAddresses) {
      await this.poolMonitor.addPool(address);
      await this.eventListener.listenToPool(address);
    }
  }

  /**
   * Cron job: scan pools every 5 minutes
   */
  private startCronJob(): void {
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      const conditions = await this.poolMonitor.scanForActions();
      await this.decisionEngine.processActions(conditions);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down NoahAI Agent...');
    this.cronJob.stop();
    await this.eventListener.shutdown();
    process.exit(0);
  }
}

// Entry point
const agent = new NoahAIAgent();
agent.start().catch(console.error);

// Handle termination signals
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());
```

---

## Implementation Plan

### Phase 2.1: Project Setup (1-2 hours)

**Tasks:**
1. Initialize Node.js project
   ```bash
   mkdir agent && cd agent
   npm init -y
   npm install ethers dotenv winston node-cron async-retry
   npm install -D typescript @types/node ts-node nodemon
   ```

2. Configure TypeScript
   ```bash
   npx tsc --init
   ```

3. Create directory structure
   ```
   agent/
   ├── src/
   │   ├── index.ts
   │   ├── eventListener.ts
   │   ├── poolMonitor.ts
   │   ├── decisionEngine.ts
   │   ├── notificationService.ts
   │   ├── types.ts
   │   └── utils/
   │       ├── logger.ts
   │       └── retry.ts
   ├── abis/
   │   ├── SusuFactory.json
   │   └── SusuPool.json
   ├── .env.example
   ├── package.json
   └── tsconfig.json
   ```

4. Set up environment configuration
   ```env
   # Blockchain
   CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
   FACTORY_ADDRESS=0x...
   PRIVATE_KEY=0x...

   # Agent Configuration
   SCAN_INTERVAL_MINUTES=5
   REMINDER_HOURS_BEFORE=24
   MAX_GAS_PRICE_GWEI=5

   # Logging
   LOG_LEVEL=info
   LOG_FILE=./logs/agent.log
   ```

**Deliverables:**
- ✅ Project initialized with dependencies
- ✅ TypeScript configured
- ✅ Directory structure created
- ✅ Environment variables documented

---

### Phase 2.2: Core Infrastructure (2-3 hours)

**Tasks:**

1. **Implement Logger** (`src/utils/logger.ts`)
   - Winston configuration
   - Console + file output
   - Structured JSON logging

2. **Implement Retry Logic** (`src/utils/retry.ts`)
   - Exponential backoff
   - Max retry attempts: 3
   - Timeout handling

3. **Define TypeScript Types** (`src/types.ts`)
   - Event interfaces
   - Pool state types
   - Configuration types

4. **Copy Contract ABIs**
   ```bash
   cp ../contracts/out/SusuFactory.sol/SusuFactory.json ./abis/
   cp ../contracts/out/SusuPool.sol/SusuPool.json ./abis/
   ```

**Deliverables:**
- ✅ Logging system operational
- ✅ Retry mechanism tested
- ✅ Type definitions complete
- ✅ Contract ABIs available

---

### Phase 2.3: Event Listener (2-3 hours)

**Tasks:**

1. Implement WebSocket provider connection
2. Load contract ABIs and create contract instances
3. Set up event filters for Factory and Pool events
4. Handle connection failures and reconnection
5. Implement event replay for missed blocks

**Testing:**
- Deploy test pool on Alfajores
- Verify events are captured
- Test reconnection after simulated disconnect

**Deliverables:**
- ✅ EventListener class functional
- ✅ All contract events captured
- ✅ Reconnection logic working

---

### Phase 2.4: Pool Monitor (2-3 hours)

**Tasks:**

1. Implement pool state management
2. Create blockchain query functions
3. Implement condition detection logic
4. Add periodic refresh mechanism

**Testing:**
- Add 3-5 test pools
- Verify state tracking accuracy
- Test condition detection (overdue payments, payout ready)

**Deliverables:**
- ✅ PoolMonitor class complete
- ✅ State tracking accurate
- ✅ Condition detection working

---

### Phase 2.5: Decision Engine (2-3 hours)

**Tasks:**

1. Implement payout trigger logic
2. Add gas estimation and safety checks
3. Implement reminder notification logic
4. Add transaction tracking

**Testing:**
- Test payout trigger on testnet
- Verify gas estimation
- Confirm transaction success handling

**Deliverables:**
- ✅ DecisionEngine functional
- ✅ Payout triggers working
- ✅ Safety checks in place

---

### Phase 2.6: Integration & Testing (2-3 hours)

**Tasks:**

1. Integrate all components in main orchestrator
2. End-to-end testing with live testnet pools
3. Load testing (simulate 10+ pools)
4. Error scenario testing (RPC failures, insufficient gas)

**Test Scenarios:**
```
Scenario 1: Happy Path
  - Create pool
  - 3 members join
  - All contribute
  - Agent auto-triggers payout ✅

Scenario 2: Late Payment
  - Pool created
  - 2/3 members contribute
  - Agent sends reminder ✅
  - 3rd member contributes
  - Agent triggers payout ✅

Scenario 3: RPC Failure
  - Disconnect RPC mid-operation
  - Agent reconnects
  - Replays missed events ✅

Scenario 4: Low Gas
  - Set gas price too low
  - Agent increases gas
  - Transaction succeeds ✅
```

**Deliverables:**
- ✅ All test scenarios passing
- ✅ Agent runs stably for 1+ hour
- ✅ Logs are clear and actionable

---

## Error Handling & Reliability

### 1. RPC Provider Failures

**Problem:** Celo RPC may be rate-limited or temporarily unavailable

**Solution:**
```typescript
async function connectWithFallback(): Promise<ethers.Provider> {
  const providers = [
    process.env.PRIMARY_RPC,
    process.env.BACKUP_RPC_1,
    process.env.BACKUP_RPC_2
  ];

  for (const rpc of providers) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      await provider.getBlockNumber(); // Health check
      return provider;
    } catch (err) {
      logger.warn(`RPC ${rpc} failed, trying next`);
    }
  }

  throw new Error('All RPC providers failed');
}
```

### 2. Transaction Failures

**Problem:** Transactions may fail due to gas, nonce issues, or reverts

**Solution:**
- Estimate gas with 20% buffer
- Use provider-managed nonce
- Catch revert reasons and log
- Don't retry on nonce errors (wait for next cycle)

```typescript
try {
  const tx = await contract.distributePot({ 
    gasLimit: estimatedGas * 120n / 100n 
  });
  await tx.wait(1); // Wait for 1 confirmation
} catch (error) {
  if (error.code === 'NONCE_EXPIRED') {
    // Wait for next scan cycle, don't retry
    return;
  }
  throw error; // Re-throw for retry logic
}
```

### 3. Data Inconsistency

**Problem:** Cached pool state may drift from blockchain state

**Solution:**
- Refresh pool state every 10 minutes regardless of events
- Verify state before executing critical actions (payout)
- Use `eth_call` to simulate before sending transactions

### 4. Duplicate Actions

**Problem:** Cron job and event handler might trigger same action

**Solution:**
```typescript
const executedActions = new Set<string>();

async function executeAction(actionId: string, fn: () => Promise<void>) {
  if (executedActions.has(actionId)) {
    logger.warn(`Action ${actionId} already executed, skipping`);
    return;
  }

  await fn();
  executedActions.add(actionId);

  // Clean up after 1 hour
  setTimeout(() => executedActions.delete(actionId), 3600000);
}
```

---

## Performance Considerations

### RPC Call Optimization

**Goal:** Minimize blockchain queries to stay within rate limits

**Strategies:**

1. **Event-Driven Updates**
   - Only query when events detected
   - Cache results in memory

2. **Batch Queries**
   ```typescript
   // Instead of N separate calls
   const states = await Promise.all(
     pools.map(addr => poolContract.attach(addr).getPoolInfo())
   );
   ```

3. **Smart Polling**
   - Critical pools: Check every 5 minutes
   - Inactive pools: Check every 30 minutes
   - Completed pools: Remove from monitoring

### Memory Management

**For 1000 pools:**
- Pool state object: ~500 bytes
- Total memory: ~500KB for state
- Logs rotation: Daily, max 100MB
- Event cache: Last 1000 events only

---

## Security Requirements

### 1. Private Key Management

**CRITICAL:** Never commit private keys to version control

```typescript
// ✅ Correct
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// ❌ NEVER DO THIS
const wallet = new ethers.Wallet('0x123abc...', provider);
```

**Best Practices:**
- Use `.env` file (add to `.gitignore`)
- On production: Use AWS Secrets Manager or similar
- Principle of least privilege (wallet only needs gas funds)

### 2. Transaction Limits

**Protection against runaway execution:**

```typescript
const MAX_TX_PER_HOUR = 100;
const MAX_GAS_PER_TX = ethers.parseUnits('1', 'gwei') * 500000n;

let txCount = 0;
const hourlyReset = setInterval(() => { txCount = 0; }, 3600000);

async function sendTransaction(tx: any) {
  if (txCount >= MAX_TX_PER_HOUR) {
    throw new Error('Hourly transaction limit reached');
  }

  if (tx.gasLimit && tx.gasLimit > MAX_GAS_PER_TX) {
    throw new Error('Transaction gas limit too high');
  }

  txCount++;
  return await signer.sendTransaction(tx);
}
```

### 3. Input Validation

**Never trust blockchain data blindly:**

```typescript
function validatePoolAddress(address: string): boolean {
  return ethers.isAddress(address) && 
         knownPools.has(address);
}
```

---

## Testing Strategy

### Unit Tests

**Framework:** Jest or Mocha

**Coverage:**
```typescript
// Example: poolMonitor.test.ts
describe('PoolMonitor', () => {
  it('should detect payout ready condition', async () => {
    const monitor = new PoolMonitor();
    const pool = createMockPool({
      allContributed: true,
      nextPayoutTime: Date.now() - 1000
    });

    const ready = monitor.isPayoutReady(pool);
    expect(ready).toBe(true);
  });

  it('should identify missing contributors', () => {
    const pool = createMockPool({
      members: ['0xA', '0xB', '0xC'],
      contributions: { '0xA': 10, '0xB': 10 }
    });

    const missing = monitor.getMissingContributors(pool);
    expect(missing).toEqual(['0xC']);
  });
});
```

### Integration Tests

**Test against live Alfajores testnet:**

```bash
# Deploy test contracts
cd ../contracts
forge script script/Deploy.s.sol --rpc-url alfajores --broadcast

# Run agent in test mode
cd ../agent
npm run test:integration
```

### Smoke Tests (Pre-Demo Checklist)

```
□ Agent starts without errors
□ Connects to factory contract
□ Discovers existing pools
□ Receives and logs events in real-time
□ Scans pools and identifies conditions
□ Triggers test payout successfully
□ Handles RPC disconnect gracefully
□ Logs are clear and timestamped
```

---

## Deployment Procedures

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Add your private key and contract addresses
nano .env

# 4. Run in development mode (auto-reload)
npm run dev
```

### Production Deployment (Cloud VM)

**Option A: AWS EC2/Lightsail**

```bash
# SSH into server
ssh -i key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/Gracing47/SusuFlow-AI.git
cd SusuFlow-AI/agent

# Install dependencies
npm ci --production

# Set up environment
nano .env  # Add production values

# Run with PM2 (process manager)
sudo npm install -g pm2
pm2 start dist/index.js --name susuflow-agent
pm2 save
pm2 startup  # Enable auto-start on reboot

# Monitor
pm2 logs susuflow-agent
```

**Option B: Railway.app (Simpler)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard
```

---

## Monitoring & Observability

### Logging Standards

**All logs must include:**
- ISO 8601 timestamp
- Log level (INFO, WARN, ERROR)
- Component name
- Action description
- Relevant addresses/amounts

**Example:**
```json
{
  "timestamp": "2025-11-28T12:34:56.789Z",
  "level": "INFO",
  "component": "DecisionEngine",
  "action": "PAYOUT_TRIGGERED",
  "pool": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "30.0",
  "txHash": "0xabc123...",
  "gasUsed": "85234"
}
```

### Key Metrics to Track

1. **Operational Metrics**
   - Pools monitored: `gauge`
   - Events processed: `counter`
   - Payouts triggered: `counter`
   - Reminders sent: `counter`

2. **Performance Metrics**
   - RPC response time: `histogram`
   - Event processing latency: `histogram`
   - Memory usage: `gauge`

3. **Error Metrics**
   - RPC failures: `counter`
   - Transaction failures: `counter`
   - Unexpected errors: `counter`

### Health Check Endpoint (Optional)

```typescript
// Add simple HTTP server for health checks
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      poolsMonitored: poolMonitor.getPoolCount(),
      lastEventTime: eventListener.getLastEventTime(),
      rpcConnected: provider.ready
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  }
});

server.listen(3000);
```

---

## Appendix

### Environment Variables Reference

```env
# --- Blockchain Configuration ---
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_CHAIN_ID=44787

# Backup RPC (fallback)
BACKUP_RPC_URL=https://alfajores-forno.celo.org

# Contract Addresses (update after deployment)
FACTORY_ADDRESS=
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# --- Wallet Configuration ---
# WARNING: Never commit this file with real private key
PRIVATE_KEY=

# --- Agent Behavior ---
SCAN_INTERVAL_MINUTES=5
REMINDER_HOURS_BEFORE=24
PAYOUT_DELAY_MINUTES=5
MAX_GAS_PRICE_GWEI=20

# --- Safety Limits ---
MAX_TX_PER_HOUR=100
MAX_RETRY_ATTEMPTS=3

# --- Logging ---
LOG_LEVEL=info
LOG_FILE=./logs/agent.log
LOG_MAX_SIZE=100m
LOG_MAX_FILES=7

# --- Monitoring (Optional) ---
HEALTH_CHECK_PORT=3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Troubleshooting Guide

**Problem:** Agent not detecting events

**Solutions:**
1. Check RPC connection: `curl https://alfajores-forno.celo-testnet.org`
2. Verify contract address is correct
3. Check event filter configuration
4. Review logs for errors

---

**Problem:** Transactions failing

**Solutions:**
1. Check wallet has CELO for gas
2. Verify gas price isn't too low
3. Check pool state meets payout conditions
4. Review contract storage (using Celoscan)

---

**Problem:** High RPC usage

**Solutions:**
1. Increase scan interval
2. Reduce number of pools monitored simultaneously
3. Use WebSocket instead of HTTP
4. Implement more aggressive caching

---

### Success Checklist

**Before marking Phase 2 complete:**

- [ ] Agent runs continuously for 2+ hours without errors
- [ ] Successfully triggers at least 1 payout on testnet
- [ ] Sends reminders for missing payments
- [ ] Logs are clear and include all required information
- [ ] Handles RPC disconnect and reconnects automatically
- [ ] All code committed to Git with meaningful messages
- [ ] README.md created in `/agent` directory
- [ ] Environment variables documented
- [ ] Demo script prepared (showing agent console during pool lifecycle)

---

**Document End**

*This specification represents production-grade practices for blockchain automation systems. All implementations should prioritize reliability, security, and observability.*

*Questions? Review the NoahAI hackathon requirements or consult Celo Discord developer community.*
