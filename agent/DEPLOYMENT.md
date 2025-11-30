# SusuFlow Agent Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Create Account**: https://railway.app
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repo**: Choose `Gracing47/SusuFlow-AI`
4. **Root Directory**: Set to `agent`
5. **Add Environment Variables**:
   ```
   FACTORY_ADDRESS=0x3d0fBFb01837259f10f3793c695008a31815D39A
   PRIVATE_KEY=your_wallet_private_key
   CELO_RPC_URL=https://forno.celo.org
   CHAIN_ID=42220
   SCAN_INTERVAL_MINUTES=5
   LOG_LEVEL=info
   ```
6. **Deploy**: Railway will auto-detect Node.js and deploy!

**Cost**: Free tier includes 500 hours/month

---

### Option 2: Render

1. **Create Account**: https://render.com
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect GitHub**: Select your repo
4. **Configuration**:
   - Name: `susuflow-agent`
   - Environment: `Node`
   - Build Command: `cd agent && npm install && npm run build`
   - Start Command: `cd agent && npm start`
   - Root Directory: `agent`
5. **Add Environment Variables** (same as above)
6. **Create Web Service**

**Cost**: Free tier available

---

### Option 3: Fly.io

1. **Install CLI**:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Deploy**:
   ```bash
   cd agent
   fly launch
   # Follow prompts, select region
   ```

4. **Set Secrets**:
   ```bash
   fly secrets set FACTORY_ADDRESS=0x3d0fBFb01837259f10f3793c695008a31815D39A
   fly secrets set PRIVATE_KEY=your_key_here
   fly secrets set CELO_RPC_URL=https://forno.celo.org
   fly secrets set CHAIN_ID=42220
   ```

**Cost**: Free tier with 3 shared CPUs

---

### Option 4: VPS (DigitalOcean/AWS/Hetzner)

**For Advanced Users**:

1. **Create Droplet/Instance**: Ubuntu 22.04 LTS
2. **SSH into server**:
   ```bash
   ssh root@your-server-ip
   ```

3. **Setup Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```

4. **Clone and Setup**:
   ```bash
   git clone https://github.com/Gracing47/SusuFlow-AI.git
   cd SusuFlow-AI/agent
   npm install
   npm run build
   ```

5. **Add Environment**:
   ```bash
   nano .env
   # Paste your variables
   ```

6. **Run with PM2** (Process Manager):
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name susuflow-agent
   pm2 save
   pm2 startup
   ```

**Cost**: $5-12/month

---

## 🔐 Important: Private Key Security

### **DO NOT** commit your `.env` file!

1. **Generate a dedicated wallet** for the agent:
   - Use MetaMask or another wallet
   - Export the private key
   - Fund it with ~0.5 CELO for gas

2. **Add to deployment platform** as environment variable (not in code!)

3. **Monitor balance**: Agent needs CELO for gas to trigger payouts

---

## ✅ Verify Deployment

After deploying, check logs to see:

```
🤖 Starting NoahAI Agent...
✅ Connected to blockchain
👂 Listening to Factory events...
📊 Monitoring X pool(s)
```

---

## 🛠️ Environment Variables Reference

### Required
| Variable | Value | Description |
|----------|-------|-------------|
| `FACTORY_ADDRESS` | `0x3d0fBFb01837259f10f3793c695008a31815D39A` | Factory contract |
| `PRIVATE_KEY` | `0x...` | Agent wallet private key |
| `CELO_RPC_URL` | `https://forno.celo.org` | Celo RPC endpoint |
| `CHAIN_ID` | `42220` | Celo Mainnet |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `SCAN_INTERVAL_MINUTES` | `5` | How often to scan pools |
| `REMINDER_HOURS_BEFORE` | `24` | Reminder timing |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `PORT` | `3000` | Server port (if needed) |

---

## 📊 Monitoring

### View Logs

**Railway**: Click on deployment → "Logs" tab
**Render**: Deployment page → "Logs"
**Fly.io**: `fly logs`
**VPS**: `pm2 logs susuflow-agent`

### Health Check

Agent should show:
- ✅ Connected to blockchain
- ✅ Monitoring pools
- ✅ No repeated errors
- ✅ Successful payout triggers

---

## 🔄 Updates

When you update code:

**Railway/Render**: Auto-deploys on git push
**Fly.io**: `fly deploy`
**VPS**:
```bash
cd SusuFlow-AI
git pull
cd agent
npm run build
pm2 restart susuflow-agent
```

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid (if needed) |
|----------|-----------|------------------|
| Railway | 500 hrs/mo | $5/mo |
| Render | 750 hrs/mo | $7/mo |
| Fly.io | 3 shared CPUs | $1.94/mo |
| DigitalOcean | - | $5/mo |

---

## 🎯 Recommended Setup

**For MVP/Testing**: Railway (easiest, no config)
**For Production**: VPS with PM2 (most control)
**For Scale**: Fly.io (good performance)

---

**Next Step**: Choose a platform and deploy! 🚀
