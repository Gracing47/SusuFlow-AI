# NoahAI Agent for SusuFlow 🤖

Autonomous AI agent that monitors and manages SusuFlow ROSCA pools on Celo blockchain.

## 🎯 What It Does

- **👂 Monitors** blockchain events in real-time
- **🔔 Sends reminders** when payments are due
- **⚡ Triggers payouts** automatically when pools are ready
- **📊 Tracks** pool health and member contributions
- **🛡️ Handles** errors and reconnections gracefully

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agent
npm install
```

This will install:
- `ethers` - Blockchain interaction
- `winston` - Logging
- `node-cron` - Scheduled tasks
- `async-retry` - Retry logic
- TypeScript and dev tools

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env file and fill in:
# - FACTORY_ADDRESS (from Phase 1 deployment)
# - PRIVATE_KEY (wallet for triggering payouts)
```

**Important:** Get testnet CELO from [Celo Faucet](https://faucet.celo.org/alfajores) for gas fees.

### 3. Build

```bash
npm run build
```

### 4. Run

**Development mode** (auto-reload on file changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

---

## 📂 Project Structure

```
agent/
├── src/
│   ├── index.ts                 # Main entry point  ⚡ TO BE CREATED
│   ├── eventListener.ts         # Event monitoring  ⚡ TO BE CREATED
│   ├── poolMonitor.ts           # Pool tracking     ⚡ TO BE CREATED
│   ├── decisionEngine.ts        # AI logic          ⚡ TO BE CREATED
│   ├── notificationService.ts   # ✅ DONE
│   ├── types.ts                 # ✅ DONE
│   └── utils/
│       ├── logger.ts            # ✅ DONE
│       └── retry.ts             # ✅ DONE
├── abis/
│   ├── SusuFactory.json         # ✅ COPIED
│   └── SusuPool.json            # ✅ COPIED
├── logs/                        # Auto-generated
├── .env                         # Your config (gitignored)
├── .env.example                 # ✅ Template
├── package.json                 # ✅ DONE
└── tsconfig.json                # ✅ DONE
```

---

## 🔧 Configuration (.env)

### Required Variables

- **FACTORY_ADDRESS**: Your deployed SusuFactory contract address
- **PRIVATE_KEY**: Wallet private key (needs CELO for gas)
- **CELO_RPC_URL**: RPC endpoint (default: Alfajores)

### Optional Variables

- **SCAN_INTERVAL_MINUTES**: How often to scan pools (default: 5)
- **REMINDER_HOURS_BEFORE**: When to send reminders (default: 24)
- **LOG_LEVEL**: Logging verbosity (default: info)

---

## 📊 What You'll See

When the agent runs, you'll see logs like:

```
2025-11-28 08:00:00 [info]: 🤖 Starting NoahAI Agent...
2025-11-28 08:00:01 [info]: ✅ Connected to blockchain
2025-11-28 08:00:02 [info]: 👂 Listening to Factory events...
2025-11-28 08:00:03 [info]: 📊 Monitoring 3 pool(s)
2025-11-28 08:05:00 [info]: 🔍 Running scheduled pool scan...
2025-11-28 08:05:01 [info]: 🆕 New pool created!
  {
    "pool": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "creator": "0x1234...",
    "txHash": "0xabc..."
  }
2025-11-28 08:10:00 [info]: 💰 Contribution made
  {
    "pool": "0x742d...",
    "member": "0x5678...",
    "amount": "10.0 cUSD",
    "round": "1"
  }
2025-11-28 09:00:00 [info]: ⚡ Attempting to trigger payout...
2025-11-28 09:00:05 [info]: ✅ Payout triggered successfully!
  {
    "pool": "0x742d...",
    "txHash": "0xdef...",
    "gasUsed": "85234"
  }
```

---

## 🎯 Next Steps

### Remaining Implementation (Follow the Development Plan)

The following files still need to be created. See `Doc/PHASE2_DEVELOPMENT_PLAN.md` for detailed code:

1. **`src/eventListener.ts`** (Step 3 - 1.5 hours)
   - WebSocket connection to blockchain
   - Event monitoring for Factory and Pools
   - Auto-reconnection logic

2. **`src/poolMonitor.ts`** (Step 4 - 1.5 hours)
   - Pool state tracking
   - Condition detection (payout ready, reminders due)
   - Blockchain queries

3. **`src/decisionEngine.ts`** (Step 5 - 1 hour)
   - Process actionable conditions
   - Trigger payout transactions
   - Send notifications

4. **`src/index.ts`** (Step 7 - 1 hour)
   - Main orchestrator
   - Cron job setup
   - Lifecycle management

---

## ✅ Testing

### Test Scenarios

1. **Create a test pool** on Alfajores
2. **Make contributions** and watch agent detect them
3. **Wait for payout time** and see agent trigger automatically
4. **Disconnect RPC** and verify agent reconnects

### Success Criteria

- [ ] Agent runs for 2+ hours without crashes
- [ ] Successfully triggers at least 1 payout
- [ ] Logs reminders for missing payments
- [ ] Handles reconnections gracefully
- [ ] All logs are clear and timestamped

---

## 🐛 Troubleshooting

### Agent won't start
- Check `.env` file exists
- Verify all required variables are set
- Ensure RPC URL is accessible

### No events detected
- Verify FACTORY_ADDRESS is correct
- Check WebSocket URL (wss:// not https://)
- Ensure pools exist on testnet

### Payout fails
- Check wallet has CELO for gas
- Verify pool meets conditions (time + contributions)
- Review gas price settings

---

## 📚 Resources

- [Development Plan](../Doc/PHASE2_DEVELOPMENT_PLAN.md) - Step-by-step guide
- [Celo Docs](https://docs.celo.org/)
- [ethers.js Docs](https://docs.ethers.org/v6/)
- [Alfajores Explorer](https://alfajores.celoscan.io/)

---

## 🏆 Phase 2 Completion Checklist

Before moving to Phase 3:

- [ ] All source files created
- [ ] Agent compiles without errors
- [ ] Successfully connects to blockchain
- [ ] Monitors at least 1 pool
- [ ] Triggers 1 successful payout on testnet
- [ ] Runs stable for 2+ hours
- [ ] Code committed to Git

---

**Built with ❤️ for the Proof of Ship Hackathon**

*Track: NoahAI - Autonomous Agent Development*
