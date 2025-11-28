# SusuFlow Smart Contracts

Solidity smart contracts for the SusuFlow AI ROSCA application on Celo.

## Architecture

- **SusuFactory.sol**: Factory contract that creates pools and manages identity verification via Self Protocol
- **SusuPool.sol**: Individual ROSCA pool contract handling contributions, payouts, and member management
- **ISelfVerification.sol**: Mock implementation of Self Protocol verification (for MVP testing)
- **IERC20.sol**: Minimal ERC20 interface for cUSD interactions

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Celo wallet with CELO for gas (Alfajores faucet: https://faucet.celo.org/alfajores)
- CeloScan API key (optional, for verification)

## Setup

1. Install dependencies:
```bash
forge install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and add your private key and API keys

## Testing

Run all tests:
```bash
forge test
```

Run tests with detailed output:
```bash
forge test -vvv
```

Run specific test:
```bash
forge test --match-test testFullCycle -vvv
```

Test coverage:
```bash
forge coverage
```

## Gas Report

```bash
forge test --gas-report
```

## Deployment

### Deploy to Alfajores (Testnet)

1. Get testnet CELO from faucet:
   https://faucet.celo.org/alfajores

2. Deploy:
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo_alfajores --broadcast
```

3. Verify (optional):
```bash
forge verify-contract <CONTRACT_ADDRESS> SusuFactory --chain celo-alfajores
```

### Deploy to Mainnet

⚠️ **WARNING**: Make sure you have reviewed all code and tested thoroughly!

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo_mainnet --broadcast --verify
```

## Contract Addresses

### Alfajores (Testnet)
- **SusuFactory**: `<TODO: Add after deployment>`
- **cUSD**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- **Self Hub V2**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`

### Mainnet
- **SusuFactory**: `<TODO: Add after deployment>`
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **Self Hub V2**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`

## Key Features

### SusuFactory
- ✅ Self Protocol integration for identity verification
- ✅ Pool creation restricted to verified users
- ✅ Tracks all pools and user pool associations
- ✅ Query functions for active pools

### SusuPool
- ✅ Member management (join, track status)
- ✅ Contribution tracking per cycle
- ✅ Automatic payout distribution (round-robin)
- ✅ Event emission for agent monitoring
- ✅ ReentrancyGuard protection
- ✅ Helper functions for missing contributors

## Events for NoahAI Agent

The contracts emit events that the AI agent monitors:

### Factory Events
```solidity
event PoolCreated(address indexed pool, address indexed creator, ...);
event UserVerified(address indexed user, bytes32 userIdentifier);
```

### Pool Events
```solidity
event MemberJoined(address indexed member, uint256 memberCount);
event ContributionMade(address indexed member, uint256 amount, uint256 round);
event PayoutDistributed(address indexed recipient, uint256 amount, uint256 round);
event PoolStarted(uint256 startTime, uint256 firstPayoutTime);
event PoolCompleted(uint256 finalRound);
```

## Security Considerations

- ✅ ReentrancyGuard on sensitive functions
- ✅ Access control via verification
- ✅ Input validation on all parameters
- ✅ Safe ERC20 interactions
- ⚠️ MVP uses simplified Self Protocol mock (replace with real integration for production)
- ⚠️ No emergency pause mechanism (add for production)
- ⚠️ No admin functions for recovery (add for production)

## Development Notes

### For MVP (Current State)
- Using `manualVerify()` function to bypass real passport verification
- Simplified Self Protocol integration for fast testing
- 100% test coverage on core functionality

### For Production
- Replace `SelfVerificationRootMock` with real Self Protocol SDK
- Add access control (Ownable)
- Add pause/unpause functionality
- Implement proper Self Protocol proof verification
- Add more granular events
- Consider upgradability patterns

## Common Tasks

### Get Pool Info
```bash
cast call <POOL_ADDRESS> "getPoolInfo()" --rpc-url celo_alfajores
```

### Check if User is Verified
```bash
cast call <FACTORY_ADDRESS> "isVerified(address)(bool)" <USER_ADDRESS> --rpc-url celo_alfajores
```

### Manually Verify User (MVP only)
```bash
cast send <FACTORY_ADDRESS> "manualVerify(address)" <USER_ADDRESS> --private-key $PRIVATE_KEY --rpc-url celo_alfajores
```

### Get Missing Contributors
```bash
cast call <POOL_ADDRESS> "getMissingContributors()(address[])" --rpc-url celo_alfajores
```

## License

MIT

## Support

- Celo Discord: https://discord.gg/celo
- Self Protocol Docs: https://docs.self.xyz/
- Foundry Book: https://book.getfoundry.sh/
