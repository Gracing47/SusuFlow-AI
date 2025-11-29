'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    // Uniswap Theme: Deep dark background
    <div className="min-h-screen bg-[#0d111c] text-white selection:bg-pink-500/30">

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Background Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

          <h2 className="relative text-6xl md:text-8xl font-bold mb-8 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Save Together.
            </span>
            <br />
            <span className="text-white">Grow Together.</span>
          </h2>

          <p className="relative text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The decentralized ROSCA protocol on Celo. Trusted savings circles powered by smart contracts and AI agents.
          </p>

          {account ? (
            <div className="relative space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-[#131a2a] rounded-[32px] p-2 border border-white/5 inline-flex flex-col md:flex-row gap-2 shadow-xl">
                <Link
                  href="/pools"
                  className="bg-[#4c82fb] hover:bg-[#3b6dcf] text-white px-12 py-4 rounded-[24px] font-semibold text-lg transition-all active:scale-95"
                >
                  Launch App
                </Link>
                <Link
                  href="/pools/create"
                  className="bg-[#1b2236] hover:bg-[#293249] text-white px-12 py-4 rounded-[24px] font-semibold text-lg transition-all border border-white/5 active:scale-95"
                >
                  Create Pool
                </Link>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                Connected: <span className="text-purple-400 font-mono">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
              </p>
            </div>
          ) : (
            <div className="relative bg-[#131a2a] rounded-[32px] p-8 border border-white/5 max-w-md mx-auto shadow-2xl">
              <p className="text-gray-300 mb-6 text-lg">Connect your wallet to start saving</p>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid - Uniswap Style Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto">
          {/* Active Pools */}
          <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform origin-left duration-300">
              {stats.activePools}
            </div>
            <div className="text-gray-400 font-medium">Active Pools</div>
          </div>

          {/* Total Saved */}
          <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl font-bold text-white group-hover:scale-110 transition-transform origin-left duration-300">
                {stats.totalSaved}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 font-medium">
              <span>Total Value Locked</span>
              <div className="flex items-center gap-2 bg-[#0d111c] px-3 py-1 rounded-full border border-white/5">
                <Image src="/celo-logo.svg" alt="Celo" width={20} height={20} />
                <span className="text-sm text-white">CELO</span>
              </div>
            </div>
          </div>

          {/* Payouts */}
          <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform origin-left duration-300">
              {stats.payoutsDistributed}
            </div>
            <div className="text-gray-400 font-medium">Payouts Distributed</div>
          </div>
        </div>

        {/* Features - Minimalist */}
        <div className="grid md:grid-cols-3 gap-12 mt-32 max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-2xl text-purple-400">
              🔒
            </div>
            <h3 className="text-2xl font-bold text-white">Secure & Transparent</h3>
            <p className="text-gray-400 leading-relaxed">
              Smart contracts ensure fair distribution. No central authority controls your funds. Code is law.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center text-2xl text-pink-400">
              🤖
            </div>
            <h3 className="text-2xl font-bold text-white">AI-Powered Automation</h3>
            <p className="text-gray-400 leading-relaxed">
              Our NoahAI agent monitors pools 24/7 and triggers payouts the moment they are due.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-2xl text-green-400">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-white">Verified Identity</h3>
            <p className="text-gray-400 leading-relaxed">
              Integrated with Self Protocol to ensure you are saving with real, verified humans.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 bg-[#0d111c]">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center text-gray-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="font-bold text-white">SusuFlow</span>
            <span>© 2025</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
