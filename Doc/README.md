# SusuFlow 💰

> Decentralized Savings Circles (ROSCA) on Celo with AI-powered automation

## Overview

SusuFlow is a Web3 platform that brings traditional African savings circles (ROSCA/Susu) onto the blockchain. It allows verified users to create and participate in savings pools with automated payouts.

### Key Features

- ✅ **Dual Token Support**: Create pools with native CELO or cUSD
- 🔐 **Self Protocol Integration**: Identity verification for trusted pools
- 🤖 **AI Automation**: NoahAI agent monitors pools and triggers payouts
- 📱 **Beautiful UI**: Modern, responsive interface built with Next.js
- ⛓️ **Smart Contracts**: Secure, audited contracts on Celo

## Quick Start

### 1. Install Dependencies

``bash
# Frontend
cd frontend && npm install

# Agent
cd agent && npm install

# Contracts
cd contracts && forge install
```

### 2. Set Up Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
NEXT_PUBLIC_FACTORY_ADDRESS=0x3d0fBFb01837259f10f3793c695008a31815D39A
NEXT_PUBLIC_SELF_VERIFICATION_ADDRESS=0x15ab8Fb807CbF0d0c2553E2bC1C2Abcf2Ee41D1b
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
```

**Agent** (`agent/.env`):
```env
FACTORY_ADDRESS=0x3d0fBFb01837259f10f3793c695008a31815D39A
CELO_RPC_URL=https://forno.celo.org
PRIVATE_KEY=your_private_key
```

### 3. Run the Application

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Agent
cd agent && npm run dev
```

Visit `http://localhost:3000` to access the app!

## Project Structure

```
SusuFlow-AI/
├── contracts/          # Solidity smart contracts
│   ├── src/           # SusuPool.sol, SusuFactory.sol
│   ├── test/          # Contract tests (Foundry)
│   └── script/        # Deployment scripts
├── frontend/          # Next.js web application
│   ├── app/           # Pages (pools, create, verify)
│   ├── components/    # React components
│   └── lib/           # Contract interaction layer
├── agent/             # NoahAI monitoring agent
│   ├── src/           # Event listener, pool monitor
│   └── abis/          # Contract ABIs
└── Doc/               # Documentation
```

## Deployed Contracts (Celo Mainnet)

- **Factory**: `0x3d0fBFb01837259f10f3793c695008a31815D39A` ([CeloScan](https://celoscan.io/address/0x3d0fBFb01837259f10f3793c695008a31815D39A))
- **Self Verification**: `0x15ab8Fb807CbF0d0c2553E2bC1C2Abcf2Ee41D1b`

## How It Works

1. **Verify Identity**: Users verify via Self Protocol (mock for MVP)
2. **Create Pool**: Choose CELO or cUSD, set contribution & cycle duration
3. **Invite Members**: Share pool link with trusted participants
4. **Auto-Payouts**: NoahAI agent triggers distributions when ready
5. **Rotating Winners**: Each cycle, a different member receives the pot

## Development

### Test Contracts
```bash
cd contracts
forge test           # Run all tests
forge test -vvv      # Verbose output
```

### Deploy Contracts
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --legacy
```

### Build Frontend
```bash
cd frontend
npm run build
npm run start        # Production mode
```

## Documentation

- [STATUS.md](../STATUS.md) - Current system status & commands
- [DEPLOYMENT_MAINNET.md](../DEPLOYMENT_MAINNET.md) - Deployment details
- [START_HERE.md](./START_HERE.md) - Getting started guide
- [ROADMAP.md](./ROADMAP.md) - Project roadmap

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Foundry
- **Frontend**: Next.js 14, React, Thirdweb SDK
- **Agent**: Node.js, TypeScript, ethers.js
- **Blockchain**: Celo (Mainnet)
- **Identity**: Self Protocol (mock for MVP)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: Report bugs or request features
- Documentation: Check the `Doc/` folder
- CeloScan: Monitor contract activity

---

**Built with ❤️ for decentralized finance**
