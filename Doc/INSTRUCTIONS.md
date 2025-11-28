# SusuFlow AI - Technical Instructions

**Mission:** Build a MiniPay-native ROSCA (Rotating Savings) app on Celo.  
**Deadline:** Hard Stop Dec 8th.  
**Priority:** Speed, Clean Architecture, and Track Compliance (NoahAI, Self Protocol, MiniPay).

---

## 1. Tech Stack & Constraints

* **Chain:** Celo Mainnet (Must use Mainnet for User/Tx volume scoring).
* **Contracts:** Solidity 0.8.20 (Foundry for testing/deployment).
* **Identity:** Self Protocol (`SelfVerificationRoot`).
* **Backend/Agent:** Node.js (TypeScript) or Next.js API Routes.
* **Frontend:** Next.js (Tailwind) + thirdweb SDK.
* **Mobile:** Must act as a Progressive Web App (PWA) inside Opera Mini.

---

## 2. Architecture Overview

We are using a **Factory Pattern** to centralize Identity verification and save gas.

```text
[ User ] --(MiniPay)--> [ Frontend ] --(thirdweb)--> [ Smart Contracts ]
                                                           ^
                                                           |
[ NoahAI Agent ] --(Cron Job)--> [ Event Listener ] -------+
```

---

## 3. Implementation Details

### A. Smart Contracts (/contracts)

**Goal:** Deploy a Factory that spawns savings pools. Users verify humanity ONCE at the Factory level.

**SusuFactory.sol:**
- Inherits: `SelfVerificationRoot`.
- Config: Use Self Protocol Mainnet Address: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`.
- Logic: `createPool()` checks `isVerified[msg.sender]`.

**SusuPool.sol:**
- Logic: Stores `cycleDuration`, `contributionAmount`, `members[]`.
- Payout: `distributePot()` sends funds to the winner of the current round.
- Token: Use Celo cUSD (`0x765DE816845861e75A25fCA122bb6898B8B1282a`).

### B. The NoahAI Agent (/agent)

**Goal:** Simulate an AI manager that keeps the savings circle alive.

**Stack:** A simple Node.js script running a Cron job (or just a loop).

**Logic:**
1. Monitor SusuPool contracts.
2. Check: Is `block.timestamp > nextPayoutTime`?
3. Check: Who hasn't paid?
4. Action: Log a "Notification" (Simulating a Telegram msg) -> "User X, please pay!".
5. Action: If pot is full, call `distributePot()`.

### C. Frontend (/frontend)

**Goal:** A "Mobile-First" UI optimized for Opera Mini.

**Auth:** Login via thirdweb (Celo Mainnet).

**Verify Flow:** If user is NOT verified -> Show Self Protocol Widget/Button.

**Dashboard:** Show "My Active Pools", "Next Payment Due", "Pot Size".

---

## 4. Critical Resources

* **Self Protocol Docs:** https://docs.self.xyz/
* **Celo Builder Kit:** https://github.com/celo-org/celo-composer
* **thirdweb Celo Docs:** https://portal.thirdweb.com/
* **Celo Documentation:** https://docs.celo.org/

---

## 5. Repo Structure

```
/contracts        (Foundry)
  /src
    SusuFactory.sol
    SusuPool.sol
  /test
    Susu.t.sol
  foundry.toml
  
/agent           (Node scripts)
  /src
    index.ts
    eventListener.ts
  package.json
  
/frontend        (Next.js)
  /app
    page.tsx
    /pools
    /verify
  /components
  next.config.js
  package.json
```

---

## 6. Best Practices & Pitfalls to Avoid

### Smart Contracts
- ✅ Always test on Alfajores first before Mainnet
- ✅ Use OpenZeppelin's ReentrancyGuard for payouts
- ✅ Emit events for all state changes (needed for NoahAI agent)
- ❌ Don't hardcode gas limits
- ❌ Don't forget to handle edge cases (pool with 1 member, missed payments)

### Frontend
- ✅ Use thirdweb's `ConnectWallet` component for seamless MiniPay integration
- ✅ Make buttons large (minimum 48px height) for mobile
- ✅ Test PWA manifest for Opera Mini compatibility
- ❌ Don't rely on window.ethereum directly (use thirdweb hooks)
- ❌ Don't forget loading states for blockchain transactions

### NoahAI Agent
- ✅ Use event filters to reduce RPC calls
- ✅ Log all actions for hackathon demo
- ✅ Handle RPC failures gracefully (retry logic)
- ❌ Don't poll every block (use reasonable intervals)

---

## 7. Hackathon Track Requirements

### NoahAI Track
- Must demonstrate AI agent automation
- Agent must interact with smart contracts
- Show decision-making logic (who to notify, when to trigger payouts)

### Self Protocol Track
- Use Self Protocol for identity verification
- Must be integrated at the contract level
- Bonus: Show how it prevents Sybil attacks

### MiniPay Track
- Must be mobile-optimized
- Test in Opera Mini browser
- Should work as PWA
- Bonus: Use deep linking for pool invites

---

## 8. Deployment Checklist

### Testnet (Alfajores)
- [ ] Deploy SusuFactory to Alfajores
- [ ] Verify contract on Celoscan
- [ ] Test full user flow
- [ ] Test agent automation

### Mainnet (Celo)
- [ ] Deploy SusuFactory to Celo Mainnet
- [ ] Verify contract on Celoscan
- [ ] Update frontend environment variables
- [ ] Deploy frontend to Vercel
- [ ] Test with real MiniPay wallet

---

## 9. Demo Video Script (30 seconds)

1. **0-5s:** Show mobile device with MiniPay wallet
2. **5-10s:** Open SusuFlow app, connect wallet, verify identity
3. **10-15s:** Create a new savings pool (quick form)
4. **15-20s:** Show dashboard with active pool, make a contribution
5. **20-25s:** Show agent logs detecting the transaction
6. **25-30s:** Show payout being distributed

---

## 10. Emergency Contacts & Resources

* **Self Protocol Discord:** Link in docs.self.xyz
* **Celo Discord:** discord.gg/celo
* **thirdweb Discord:** discord.gg/thirdweb

**Remember:** Speed over perfection. Ship a working demo that checks all track requirements!
