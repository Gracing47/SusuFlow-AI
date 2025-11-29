'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useActiveAccount } from 'thirdweb/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllPools } from '@/lib/contracts/factory';
import { getPoolInfo } from '@/lib/contracts/pool';
import { formatUnits } from 'ethers';

export default function Home() {
  const account = useActiveAccount();
  const [stats, setStats] = useState({
    activePools: 0,
    totalVolume: 0,
    totalPayouts: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const pools = await getAllPools();
        let activeCount = 0;
        let volume = 0;
        let payouts = 0;

        // Fetch details for each pool
        // Note: In production, this should be aggregated off-chain or via a subgraph
        const poolPromises = pools.map(address => getPoolInfo(address));
        const poolInfos = await Promise.all(poolPromises);

        poolInfos.forEach(info => {
          if (!info) return;

          if (info.isActive) activeCount++;

          // Calculate approximate volume: contribution * members * (currentRound - 1)
          // This assumes all previous rounds were full payouts
          const roundsCompleted = Number(info.currentRound) - 1;
          if (roundsCompleted > 0) {
            const poolVolume = Number(formatUnits(info.contributionAmount, 18)) * Number(info.memberCount) * roundsCompleted;
            volume += poolVolume;
            payouts += roundsCompleted;
          }
        });

        setStats({
          activePools: activeCount,
          totalVolume: volume,
          totalPayouts: payouts
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Hero Card */}
          <div className="bg-[#131415] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Save Together.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Grow Together.
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              The decentralized ROSCA protocol on Celo.
              <br />
              Automated, transparent, and trusted savings circles.
            </p>

            {!account && (
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-gray-400 mb-4">Connect your wallet to start saving</p>
                <div className="flex justify-center">
                  <WalletConnect />
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">{stats.activePools}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Active Pools</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-purple-400 mb-1">${stats.totalVolume.toFixed(0)}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Volume</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-pink-500 mb-1">{stats.totalPayouts}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Payouts</div>
            </div>
          </div>
        </div>

        {/* Features / Trust Badges */}
        <div className="mt-24 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-2xl">🔒</span> Self Protocol Identity
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-2xl">⚡</span> Celo Blockchain
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-2xl">🤖</span> NoahAI Agent
          </div>
        </div>
      </main>
    </div>
  );
}
