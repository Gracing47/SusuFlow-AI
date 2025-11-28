# Phase 3: Frontend Development (MiniPay PWA)

**Status:** 🚧 In Progress  
**Start Date:** 2025-11-28  
**Target:** Mobile-First PWA with MiniPay Integration

---

## 🎯 Goals

1. **Mobile-First UI:** Optimized for MiniPay browser on Opera Mini
2. **Wallet Integration:** Seamless connection via Thirdweb
3. **Pool Management:** Create, join, and monitor ROSCA pools
4. **Real-Time Updates:** Live tracking of contributions and payouts
5. **Self Protocol:** Identity verification for trusted pools

---

## 🛠 Tech Stack

### Core Framework
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (for rapid styling)

### Blockchain
- **Thirdweb SDK** (Wallet connection & contract interaction)
  - Client ID: `901510de63917ef83ae4884821344a87`
- **ethers.js v6** (Contract reads/writes)
- **wagmi/viem** (React hooks for Web3)

### UI Components
- **shadcn/ui** (Beautiful, accessible components)
- **Radix UI** (Headless primitives)
- **Lucide Icons** (Modern icon set)

### State Management
- **React Context** (Global state)
- **TanStack Query** (Data fetching & caching)

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home/Dashboard
│   ├── pools/
│   │   ├── page.tsx            # Pool list
│   │   ├── [id]/page.tsx       # Pool details
│   │   └── create/page.tsx     # Create pool wizard
│   └── profile/page.tsx        # User profile
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── wallet/
│   │   ├── ConnectButton.tsx
│   │   └── WalletProvider.tsx
│   ├── pool/
│   │   ├── PoolCard.tsx
│   │   ├── PoolDetails.tsx
│   │   ├── ContributionModal.tsx
│   │   └── CreatePoolWizard.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/
│   ├── contracts/
│   │   ├── factory.ts          # Factory contract interaction
│   │   └── pool.ts             # Pool contract interaction
│   ├── hooks/
│   │   ├── useFactory.ts
│   │   ├── usePool.ts
│   │   └── useContribution.ts
│   └── utils/
│       ├── format.ts           # Number/date formatting
│       └── constants.ts        # Contract addresses, etc.
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # App icons (512x512, etc.)
│   └── images/
└── styles/
    └── globals.css             # Global styles + Tailwind
```

---

## 🚀 Implementation Plan

### Step 1: Project Setup (30 min)

**Create Next.js App:**
```bash
cd c:\Users\blexx\Desktop\Code\SusuFlow-AI
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
```

**Install Dependencies:**
```bash
npm install @thirdweb-dev/react @thirdweb-dev/sdk ethers@6
npm install @tanstack/react-query
npm install lucide-react class-variance-authority clsx tailwind-merge
```

**Install shadcn/ui:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add dialog tabs progress badge
```

**Configure PWA:**
```bash
npm install next-pwa
```

---

### Step 2: Environment Configuration (15 min)

**Create `frontend/.env.local`:**
```env
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=901510de63917ef83ae4884821344a87

# Contracts (Celo Mainnet)
NEXT_PUBLIC_FACTORY_ADDRESS=0xa060c7ea6aadf0dd79190ab219d2a85223fd1b1b
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_CHAIN_ID=42220

# API (if needed later)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### Step 3: Wallet Integration (1 hour)

**File: `app/providers.tsx`**
```typescript
'use client';

import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Celo } from '@thirdweb-dev/chains';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider
      activeChain={Celo}
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      supportedWallets={['metamask', 'walletConnect', 'coinbaseWallet']}
    >
      {children}
    </ThirdwebProvider>
  );
}
```

**File: `components/wallet/ConnectButton.tsx`**
```typescript
'use client';

import { ConnectWallet } from '@thirdweb-dev/react';

export function ConnectButton() {
  return (
    <ConnectWallet
      theme="dark"
      btnTitle="Connect Wallet"
      modalTitle="Connect to SusuFlow"
      modalSize="compact"
    />
  );
}
```

---

### Step 4: Contract Integration (2 hours)

**File: `lib/contracts/factory.ts`**
```typescript
import { useContract, useContractRead, useContractWrite } from '@thirdweb-dev/react';
import FactoryABI from '@/abis/SusuFactory.json';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;

export function useFactory() {
  const { contract } = useContract(FACTORY_ADDRESS, FactoryABI.abi);
  
  const { data: pools, isLoading } = useContractRead(
    contract,
    'getAllPools',
    [0, 100] // start, limit
  );

  const { mutateAsync: createPool } = useContractWrite(
    contract,
    'createPool'
  );

  return { pools, isLoading, createPool };
}
```

**File: `lib/contracts/pool.ts`**
```typescript
import { useContract, useContractRead } from '@thirdweb-dev/react';
import PoolABI from '@/abis/SusuPool.json';

export function usePool(poolAddress: string) {
  const { contract } = useContract(poolAddress, PoolABI.abi);

  const { data: poolInfo } = useContractRead(contract, 'getPoolInfo');
  const { data: members } = useContractRead(contract, 'getMemberCount');

  return { poolInfo, members, contract };
}
```

---

### Step 5: UI Components (3-4 hours)

**File: `components/pool/PoolCard.tsx`**
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Coins } from 'lucide-react';

interface PoolCardProps {
  address: string;
  contributionAmount: bigint;
  members: number;
  totalMembers: number;
  nextPayout: number;
}

export function PoolCard({ 
  address, 
  contributionAmount, 
  members, 
  totalMembers,
  nextPayout 
}: PoolCardProps) {
  const progress = (members / totalMembers) * 100;
  const isReady = members === totalMembers;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold truncate">
            Pool {address.slice(0, 6)}...{address.slice(-4)}
          </h3>
          <Badge variant={isReady ? 'success' : 'default'}>
            {isReady ? 'Ready' : 'Filling'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{members}/{totalMembers} Members</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span>{formatCUSD(contributionAmount)} cUSD</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(nextPayout)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**File: `components/pool/CreatePoolWizard.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useFactory } from '@/lib/contracts/factory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreatePoolWizard() {
  const [amount, setAmount] = useState('10');
  const [members, setMembers] = useState('5');
  const [duration, setDuration] = useState('7');
  
  const { createPool } = useFactory();

  const handleCreate = async () => {
    const contributionAmount = parseUnits(amount, 18); // cUSD has 18 decimals
    const cycleDuration = parseInt(duration) * 24 * 60 * 60; // days to seconds
    const totalMembers = parseInt(members);

    await createPool({
      args: [contributionAmount, cycleDuration, totalMembers]
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="amount">Contribution Amount (cUSD)</Label>
        <Input 
          id="amount" 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="members">Total Members</Label>
        <Input 
          id="members" 
          type="number" 
          min="2"
          max="10"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="duration">Cycle Duration (days)</Label>
        <Input 
          id="duration" 
          type="number" 
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      <Button onClick={handleCreate} className="w-full">
        Create Pool
      </Button>
    </div>
  );
}
```

---

### Step 6: Pages (2 hours)

**File: `app/page.tsx`** (Dashboard)
```typescript
import { PoolCard } from '@/components/pool/PoolCard';
import { useFactory } from '@/lib/contracts/factory';

export default function Home() {
  const { pools, isLoading } = useFactory();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your ROSCA Pools</h1>
      
      {isLoading ? (
        <div>Loading pools...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools?.map((pool) => (
            <PoolCard key={pool} address={pool} />
          ))}
        </div>
      )}
    </main>
  );
}
```

---

### Step 7: PWA Configuration (30 min)

**File: `public/manifest.json`**
```json
{
  "name": "SusuFlow",
  "short_name": "SusuFlow",
  "description": "Decentralized ROSCA on Celo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#00D9FF",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**File: `next.config.js`**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

---

## ✅ Testing Checklist

### Functional Tests
- [ ] Connect wallet (MetaMask, MiniPay)
- [ ] View all pools
- [ ] Create new pool
- [ ] Join existing pool
- [ ] Make contribution
- [ ] View pool details
- [ ] Receive payout (when eligible)

### Mobile Tests (MiniPay)
- [ ] PWA installs correctly
- [ ] UI responsive on mobile
- [ ] Wallet connects in Opera Mini
- [ ] Transactions work on mobile

### Edge Cases
- [ ] No wallet connected → Show connect button
- [ ] Pool full → Disable join
- [ ] Insufficient cUSD → Show error
- [ ] Network error → Retry mechanism

---

## 🚀 Deployment

### Build & Deploy
```bash
npm run build
npm run start  # Or deploy to Vercel
```

### Vercel Deployment
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### MiniPay Testing
1. Open in Opera Mini browser
2. Navigate to deployed URL
3. Test full flow
4. Submit to MiniPay directory

---

## 📊 Success Metrics

- [ ] Load time < 2s on mobile
- [ ] Wallet connection < 5s
- [ ] Transaction confirmation visible
- [ ] Pool list refreshes in real-time
- [ ] PWA score > 90 (Lighthouse)

---

## 🎨 Design Principles

1. **Mobile-First:** Everything optimized for small screens
2. **Clear CTAs:** Obvious next actions
3. **Real-Time Feedback:** Loading states, confirmations
4. **Trust Signals:** Self Protocol badges, verified pools
5. **Minimal Friction:** 3 taps to contribute

---

## 📝 Next Steps

1. Initialize Next.js project
2. Set up Thirdweb providers
3. Build PoolCard component
4. Integrate contract reads
5. Test on MiniPay

---

**Let's start building! 🚀**
