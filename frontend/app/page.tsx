'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllPools } from '@/lib/contracts/factory';

export default function Home() {
  const account = useActiveAccount();
  const [stats, setStats] = useState({
    activePools: 0,
    totalSaved: '0',
    payoutsDistributed: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const pools = await getAllPools();
        setStats({
          activePools: pools.length,
          totalSaved: '0', // TODO: Calculate from pool balances
          payoutsDistributed: 0 // TODO: Calculate from events
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Decentralized Savings Circles
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join trusted ROSCA pools on Celo. Save together, earn together, powered by blockchain.
          </p>

          {account ? (
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <p className="text-white mb-4">
                  ✅ Wallet Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/pools"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    Browse Pools
                  </Link>
                  <Link
                    href="/pools/create"
                    className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    Create Pool
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-white mb-4">Connect your wallet to get started</p>
              <WalletConnect />
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Transparent</h3>
            <p className="text-gray-400">
              Smart contracts ensure fair distribution and automated payouts
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-400">
              NoahAI agent monitors pools and triggers payouts automatically
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-white mb-2">Verified Members</h3>
            <p className="text-gray-400">
              Self Protocol integration for trusted, identity-verified pools
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
          <div className="text-center bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{stats.activePools}</div>
            <div className="text-gray-400">Active Pools</div>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-white">{stats.totalSaved}</span>
              <div className="flex flex-col gap-1">
                <span className="text-lg text-yellow-400 flex items-center gap-1">
                  🪙 CELO
                </span>
                <span className="text-lg text-green-400 flex items-center gap-1">
                  💵 cUSD
                </span>
              </div>
            </div>
            <div className="text-gray-400">Total Saved</div>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{stats.payoutsDistributed}</div>
            <div className="text-gray-400">Payouts Distributed</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>Built on Celo • Powered by Thirdweb • Secured by Self Protocol</p>
        </div>
      </footer>
    </div>
  );
}
