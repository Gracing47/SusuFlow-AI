# SusuFlow Frontend Dual-Token Support

## Summary

The frontend has been updated to fully support both **native CELO** and **ERC20 tokens** (like cUSD) for pool creation and contributions.

## Changes Made

### 1. Pool Creation Page (`frontend/app/pools/create/page.tsx`)

**New Features:**
- ✅ **Token Selector**: Visual button selector for CELO vs cUSD
- ✅ **Dynamic Token Display**: Shows selected token symbol throughout the form
- ✅ **User Hints**: Clear explanations of the difference (no approval vs approval needed)

**Token Selector UI:**
```
🪙 Native CELO          💵 cUSD
Easier, no approval     Stable coin
```

**UX Improvements:**
- Token selection visually highlighted with purple border
- Summary updates with correct token symbol
- Contribution labeled with proper token

### 2. Pool Details Page (`frontend/app/pools/[id]/page.tsx`)

**New Features:**
- ✅ **Token Detection**: Automatically detects if pool uses CELO or cUSD
- ✅ **Token Badge**: Visual indicator showing token type
- ✅ **Conditional Contributions**:
  - **Native CELO**: Send value directly, one transaction
  - **ERC20 (cUSD)**: Approve + contribute, two transactions
- ✅ **Dynamic Display**: Shows correct token symbol everywhere (pot size, contributions, etc.)
- ✅ **User Hints**: Different messages for CELO vs cUSD users

**Contribution Flow:**

**CELO:**
1. User clicks "Pay Contribution (1.0 CELO)"
2. Single transaction with value
3. Done! ✨

**cUSD:**
1. User clicks "Pay Contribution (1.0 cUSD)"
2. Transaction 1: Approve cUSD spending
3. Transaction 2: Call contribute()
4. Done! 💡

### 3. Contract Interaction Layer (`frontend/lib/contracts/`)

**factory.ts:**
- Updated `prepareCreatePool()` to accept `tokenAddress` as first parameter
- `address(0)` for CELO, token contract address for ERC20

**pool.ts:**
- Added `getPoolTokenInfo()` to fetch `isNativeToken` and `tokenAddress`
- Updated `prepareContribute()` to accept optional `value` parameter for CELO

## Usage

### Creating a Pool

**Native CELO Pool:**
1. Select "🪙 Native CELO"
2. Enter contribution (e.g., 1 CELO)
3. Fill other details
4. Click "Create Pool"
5. Confirm transaction

**cUSD Pool:**
1. Select "💵 cUSD"
2. Enter contribution (e.g., 10 cUSD)
3. Fill other details
4. Click "Create Pool"
5. Confirm transaction

### Contributing to a Pool

**CELO Pool:**
- Simple one-click contribution
- No approval needed
- Message: "✨ No approval needed - just sign the transaction!"

**cUSD Pool:**
- Two-step process (automatic)
- Step 1: Approve token
- Step 2: Contribute
- Message: "💡 You'll need to approve cUSD spending first"

## Visual Indicators

### Token Type Badge (Pool Details)
- **CELO Pools**: Yellow badge with "🪙 CELO"
- **cUSD Pools**: Green badge with "💵 cUSD"

### Contribution Status
- **Paid**: Green badge
- **Pending**: Red badge
- **Winner**: Yellow badge with "👑"

## Next Steps

### Required Before Testing:
1. ✅ Smart contracts redeployed with dual-token support
2. ✅ Update `.env.local` with new factory address
3. ✅ Recompile contract ABIs if needed

### Testing Checklist:
- [ ] Create a native CELO pool
- [ ] Join CELO pool
- [ ] Contribute to CELO pool (verify single transaction)
- [ ] Create a cUSD pool
- [ ] Join cUSD pool
- [ ] Contribute to cUSD pool (verify two transactions)
- [ ] Verify correct token symbols display
- [ ] Verify pot balance shows correctly
- [ ] Test distribute pot for both token types

## Files Modified

```
frontend/
├── app/
│   ├── pools/
│   │   ├── create/page.tsx     (Token selector added)
│   │   └── [id]/page.tsx       (Token detection & conditional logic)
├── lib/
│   └── contracts/
│       ├── factory.ts          (Added tokenAddress param)
│       └── pool.ts             (Token info & value param)
```

## Technical Details

### Contract Calls

**Create Pool (CELO):**
```typescript
factory.createPool(
  '0x0000000000000000000000000000000000000000', // address(0)
  parseUnits('1', 18),    // 1 CELO
  7 * 24 * 60 * 60,       // 7 days
  5                       // 5 members
)
```

**Create Pool (cUSD):**
```typescript
factory.createPool(
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // cUSD address
  parseUnits('10', 18),   // 10 cUSD
  7 * 24 * 60 * 60,       // 7 days
  5                       // 5 members
)
```

**Contribute (CELO):**
```typescript
pool.contribute{value: contributionAmount}()
```

**Contribute (cUSD):**
```typescript
// Step 1
cUSD.approve(poolAddress, contributionAmount)

// Step 2
pool.contribute()
```

## Benefits

### Native CELO:
- ✅ No token approval needed
- ✅ Single transaction
- ✅ Easier for new users
- ✅ Lower gas costs

### cUSD:
- ✅ Stable value (pegged to USD)
- ✅ Familiar for users with cUSD
- ✅ Better for savings (no price volatility)

## Support

If you encounter issues:
1. Check wallet has sufficient balance (CELO or cUSD)
2. For cUSD pools, ensure approval transaction completed
3. Verify contract addresses in `.env.local`
4. Check browser console for errors

---

**Status**: ✅ Frontend fully updated and ready for testing with redeployed contracts
