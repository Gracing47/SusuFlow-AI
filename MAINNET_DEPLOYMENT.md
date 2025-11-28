# 🌐 Celo Mainnet Deployment Guide

**IMPORTANT:** This is PRODUCTION deployment on Celo Mainnet with REAL money!

---

## ⚠️ Before You Start

### Critical Warnings

1. **Real Money:** Mainnet uses real CELO and cUSD, not testnet tokens
2. **Gas Costs:** All transactions cost real money
3. **Private Keys:** NEVER share or commit your mainnet private key
4. **Test First:** Always test on Alfajores testnet before mainnet
5. **Backup:** Save your deployed contract addresses securely

### What You Need

- [ ] **Real CELO** for gas fees (~$5-10 worth to be safe)
- [ ] **Tested Contracts** on Alfajores testnet first
- [ ] **Secure Wallet** with private key
- [ ] **Node.js 18+** installed

---

## 📋 Pre-Deployment Checklist

### Phase 0: Test on Testnet First! ✅

**ALWAYS test on Alfajores before mainnet:**

```bash
cd c:\Users\blexx\Desktop\Code\SusuFlow-AI\contracts

# Deploy to Alfajores first
forge script script/Deploy.s.sol --rpc-url celo_alfajores --broadcast

# Test the contracts
# Create a pool, make contributions, trigger payouts
# Ensure everything works perfectly
```

**Only proceed to mainnet when:**
- [ ] All tests pass
- [ ] Deployment works on Alfajores
- [ ] You've tested the full lifecycle
- [ ] Agent can trigger payouts successfully

---

## 🚀 Part 1: Deploy Smart Contracts to Mainnet

### Step 1: Get Real CELO

**Purchase CELO:**
1. Buy on exchange (Coinbase, Binance, etc.)
2. Send to your wallet address
3. Keep ~10 CELO for gas fees

**Or use on-ramp:**
- MiniPay (in Opera Mini)
- Valora wallet
- Direct purchase on Celo network

### Step 2: Configure Contracts for Mainnet

```bash
cd c:\Users\blexx\Desktop\Code\SusuFlow-AI\contracts

# Create .env file (if not exists)
cp .env.example .env
```

**Edit `contracts/.env`:**
```env
# Your MAINNET wallet private key (NOT the mnemonic!)
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Get API key from https://celoscan.io/myapikey
CELOSCAN_API_KEY=YOUR_CELOSCAN_API_KEY

# These are already correct for mainnet:
SELF_VERIFICATION_ROOT=0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF
CUSD_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
CELO_MAINNET_RPC_URL=https://forno.celo.org
```

### Step 3: Deploy to Mainnet

```bash
# Double-check you're deploying to MAINNET
forge script script/Deploy.s.sol --rpc-url celo_mainnet --broadcast

# Expected output:
# ✅ Deployed SusuFactory to: 0x...
# ✅ Self Protocol root: 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF
# ✅ cUSD Address: 0x765DE816845861e75A25fCA122bb6898B8B1282a
```

**SAVE THESE ADDRESSES IMMEDIATELY!**
- Factory Address: `0x________________`
- Transaction Hash: `0x________________`

### Step 4: Verify Contracts on CeloScan

```bash
# Verify on CeloScan (makes contract readable/trustworthy)
forge verify-contract YOUR_FACTORY_ADDRESS SusuFactory \
  --chain celo \
  --constructor-args $(cast abi-encode "constructor(address)" 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF) \
  --watch
```

**Check verification:**
- Visit: https://celoscan.io/address/YOUR_FACTORY_ADDRESS
- Should show ✅ green checkmark and "Contract Source Code Verified"

---

## 🤖 Part 2: Configure Agent for Mainnet

### Step 1: Install Node.js (if not done)

**Download & Install:**
1. Go to https://nodejs.org/
2. Download LTS version (v20.x recommended)
3. Run installer, accept defaults
4. **Restart PowerShell terminal**
5. Verify: `node --version` and `npm --version`

### Step 2: Install Agent Dependencies

```bash
cd c:\Users\blexx\Desktop\Code\SusuFlow-AI\agent
npm install
```

**Expected output:**
```
added 150+ packages
```

### Step 3: Configure Agent for Mainnet

```bash
# Create .env from template (already updated for mainnet!)
cp .env.example .env
```

**Edit `agent/.env`:**
```env
# --- Blockchain Configuration ---
# CELO MAINNET - PRODUCTION
CELO_RPC_URL=https://forno.celo.org
CELO_WS_RPC_URL=wss://forno.celo.org/ws
CELO_CHAIN_ID=42220

# Backup RPC
BACKUP_RPC_URL=https://rpc.ankr.com/celo

# YOUR DEPLOYED CONTRACT FROM STEP 1.3 ABOVE
FACTORY_ADDRESS=0xYOUR_FACTORY_ADDRESS_HERE

# Mainnet cUSD (already correct)
CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a

# --- Wallet Configuration ---
# Agent's wallet (needs CELO for gas to trigger payouts)
PRIVATE_KEY=0xYOUR_AGENT_WALLET_PRIVATE_KEY

# --- Agent Behavior ---
SCAN_INTERVAL_MINUTES=5
REMINDER_HOURS_BEFORE=24
MAX_GAS_PRICE_GWEI=5

# --- Safety Limits ---
MAX_TX_PER_HOUR=100
MAX_RETRY_ATTEMPTS=3

# --- Logging ---
LOG_LEVEL=info
```

**Important:**
- Use a SEPARATE wallet for the agent (not your main wallet)
- Fund it with ~2 CELO for gas
- This wallet will trigger payouts automatically

---

## 🧪 Part 3: Testing on Mainnet

### Create Initial Test Pool

**Option 1: Using Foundry**
```bash
cd contracts
forge script script/CreateTestPool.s.sol --rpc-url celo_mainnet --broadcast
```

**Option 2: Using CeloScan**
1. Go to: https://celoscan.io/address/YOUR_FACTORY_ADDRESS#writeContract
2. Connect your wallet
3. Call `manualVerify()` to verify yourself
4. Call `createPool()` with parameters:
   - `_contributionAmount`: 1000000000000000000 (1 cUSD)
   - `_cycleDuration`: 86400 (1 day)
   - `_totalMembers`: 3

### Start the Agent

```bash
cd agent

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

**Expected output:**
```
╔════════════════════════════════════════╗
║     NoahAI Agent for SusuFlow          ║
║     Autonomous ROSCA Management        ║
╚════════════════════════════════════════╝

2025-11-28 08:00:00 [info]: 🤖 Starting NoahAI Agent...
2025-11-28 08:00:01 [info]: ✅ Connected to Celo Mainnet
2025-11-28 08:00:02 [info]: 👂 Listening to Factory events...
2025-11-28 08:00:03 [info]: 📊 Monitoring 1 pool(s)
```

---

## 💰 Cost Estimation

### Initial Deployment Costs
- Deploy SusuFactory: ~0.5 CELO ($0.30-0.50)
- Verify contract: FREE
- Create first pool: ~0.3 CELO ($0.18-0.30)
- **Total Setup: ~1 CELO ($0.60-1.00)**

### Ongoing Agent Costs
- Trigger payout per pool: ~0.02 CELO ($0.01-0.02)
- Per 100 payouts: ~2 CELO ($1.20-2.00)

**Recommendation:** Keep 5-10 CELO in agent wallet

---

## 🛡️ Security Best Practices

### Private Key Management

1. **Never commit `.env` to Git** (already in .gitignore)
2. **Use different wallets:**
   - Deployer wallet (main funds)
   - Agent wallet (small amount for automation)
3. **Backup your keys** in a password manager
4. **Use hardware wallet** for deployer (Ledger/Trezor)

### Agent Security

1. **Set transaction limits** in `.env`:
   ```env
   MAX_TX_PER_HOUR=100
   MAX_GAS_PRICE_GWEI=5
   ```
2. **Monitor logs** regularly
3. **Set up alerts** for unusual activity
4. **Run on secure server** (not your laptop)

---

## 🚀 Production Deployment (Cloud)

### Deploy Agent to Cloud Server

**Option A: Railway.app** (Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

**Option B: AWS/Google Cloud**
```bash
# SSH into server
ssh your-server

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/YOUR_USERNAME/SusuFlow-AI.git
cd SusuFlow-AI/agent

# Install dependencies
npm ci --production

# Set up environment
nano .env  # Add your production values

# Run with PM2 (process manager)
sudo npm install -g pm2
npm run build
pm2 start dist/index.js --name susuflow-agent
pm2 save
pm2 startup  # Enable auto-start on reboot

# Monitor
pm2 logs susuflow-agent
```

---

## 📊 Monitoring & Maintenance

### Check Agent Health

```bash
# View logs
pm2 logs susuflow-agent

# Check status
pm2 status

# Restart if needed
pm2 restart susuflow-agent
```

### Monitor on CeloScan

- Factory: https://celoscan.io/address/YOUR_FACTORY_ADDRESS
- View all transactions
- Check gas usage
- Monitor pool creation

---

## ✅ Mainnet Deployment Checklist

### Pre-Deployment
- [ ] All contracts tested on Alfajores
- [ ] Agent tested on Alfajores
- [ ] Full pool lifecycle completed successfully
- [ ] Documentation reviewed
- [ ] CeloScan API key obtained

### Deployment
- [ ] Contracts deployed to Celo Mainnet
- [ ] Contracts verified on CeloScan
- [ ] Factory address saved securely
- [ ] Agent configured with mainnet RPC
- [ ] Agent wallet funded with CELO
- [ ] Test pool created successfully

### Post-Deployment
- [ ] Agent running and detecting events
- [ ] First payout triggered successfully
- [ ] Logs are clean and informative
- [ ] Agent deployed to cloud (production)
- [ ] Monitoring set up
- [ ] Backup plan in place

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"
**Solution:** Add more CELO to agent wallet

### "Transaction reverted"
**Check:**
- Is pool ready for payout?
- Have all members contributed?
- Has payout time passed?

### "RPC connection failed"
**Solutions:**
- Try backup RPC: `https://rpc.ankr.com/celo`
- Check internet connection
- Verify RPC URL is correct

---

## 📞 Support Resources

- **Celo Discord:** https://discord.gg/celo
- **Self Protocol Discord:** https://docs.self.xyz/
- **CeloScan:** https://celoscan.io/
- **Celo Docs:** https://docs.celo.org/

---

## 🎉 You're Live on Mainnet!

Congratulations! You're running a production AI agent on Celo Mainnet!

**Next Steps:**
1. Create pools for real users
2. Document your journey
3. Submit to hackathon
4. Celebrate! 🎊

---

_Last Updated: 2025-11-28_
_Network: Celo Mainnet (Chain ID: 42220)_
