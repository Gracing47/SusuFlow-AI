# SusuFlow Dual-Token Support Update

## Overview
The SusuFlow smart contracts have been refactored to support **both native CELO and ERC20 tokens** (like cUSD). This allows users to create pools using either payment method, making the system more flexible and easier to use.

## Key Changes

### 1. **SusuPool.sol** - Core Pool Logic
- **New Field**: `isNativeToken` - Boolean flag to distinguish between native CELO and ERC20 pools
- **Updated Constructor**: Now accepts `address(0)` for native CELO or token address for ERC20
- **Dual Contribution Logic**:
  - **Native CELO**: Users send exact amount via `msg.value`
  - **ERC20 (cUSD)**: Users must approve contract first, then call `contribute()` with `msg.value = 0`
- **Dual Payout Logic**:
  - **Native CELO**: Direct `.call{value:}` transfer
  - **ERC20**: Standard `token.transfer()` call
- **Enhanced Comments**: Every function now has detailed documentation explaining parameters, behavior, and edge cases

### 2. **SusuFactory.sol** - Pool Creation
- **Updated `createPool` Parameters**:
  ```solidity
  function createPool(
      address _token,              // address(0) for CELO, or ERC20 address
      uint256 _contributionAmount, // Amount in wei
      uint256 _cycleDuration,      // Duration in seconds
      uint256 _maxMembers          // 2-50 members
  ) external onlyVerified returns (address poolAddress)
  ```
- **Event Enhancement**: `PoolCreated` event now includes `isNativeToken` flag
- **Detailed Examples**: Added inline documentation with specific examples for both token types

### 3. **ISelfVerification.sol** - Clean Interface
- Simplified to a pure interface (no implementation)
- Mock implementations moved to test and deployment scripts

### 4. **Deploy.s.sol** - Deployment Script
- Now deploys `MockSelfVerificationForDeployment` alongside the factory
- Updated instructions for both Alfajores and Mainnet
- Clear guidance on creating pools with both token types

### 5. **Susu.t.sol** - Comprehensive Testing
- **16 Tests** covering both native CELO and ERC20 scenarios:
  - Native CELO pool creation and full cycle
  - ERC20 pool creation and full cycle
  - Error handling (wrong amounts, unauthorized access)
  - Edge cases (early payout, missing contributions)
  - Factory functions (pagination, pool listing)
- **All tests pass** ✅

## Usage Examples

### Creating a Pool

#### Native CELO Pool (1 CELO, 7-day cycles, 5 members):
```solidity
factory.createPool(
    address(0),             // Native CELO
    1 ether,                //  1 CELO
    7 days,                 // 7-day cycles
    5                       // 5 members max
);
```

#### cUSD Pool (10 cUSD, 7-day cycles, 5 members):
```solidity
factory.createPool(
    0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1,  // cUSD on Alfajores
    10 ether,                                     // 10 cUSD
    7 days,                                       // 7-day cycles
    5                                             // 5 members max
);
```

### Contributing to a Pool

#### Native CELO:
```solidity
// Send CELO directly
pool.contribute{value: 1 ether}();
```

#### cUSD:
```solidity
// 1. Approve the pool to spend cUSD
cUSD.approve(poolAddress, 10 ether);

// 2. Contribute (no msg.value)
pool.contribute();
```

## Frontend Integration Next Steps

1. **Update Pool Creation Form**:
   - Add token selector (CELO vs cUSD)
   - Update `createPool` call to pass correct token address

2. **Update Contribution Logic**:
   - Check `pool.isNativeToken()`
   - If true: Send CELO with transaction
   - If false: Approve token first, then call contribute

3. **Update Display**:
   - Show correct token symbol (CELO vs cUSD)
   - Remove approval step for CELO pools

## Security Considerations

- **Native CELO**: Automatic via `msg.value`, no approval needed
- **ERC20**: Standard ERC20 approval flow, requires two transactions
- **Validation**: Contract validates exact contribution amount for both types
- **Reentrancy**: All transfer functions use `nonReentrant` modifier

## Testing

Run all tests:
```bash
cd contracts
forge test -vv
```

Expected output:
```
Ran 16 tests for test/Susu.t.sol:SusuTest
[PASS] All tests passing ✅
```

## Deployment

Deploy to Alfajores:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $ALFAJORES_RPC \
  --broadcast \
  --verify \
  -vvvv
```

## Summary

The contracts now:
- ✅ Support both native CELO and ERC20 tokens
- ✅ Have comprehensive developer comments
- ✅ Pass all 16 tests
- ✅ Are ready for deployment
- ✅ Have clean, modular code structure

**Next**: Update frontend to support token selection and dual contribution flows.
