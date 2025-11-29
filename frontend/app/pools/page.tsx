'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { PoolCard } from '@/components/PoolCard';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllPools } from '@/lib/contracts/factory';

export default function PoolsPage() {
    const account = useActiveAccount();
    const [pools, setPools] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPools() {
            const poolAddresses = await getAllPools();
            setPools([...poolAddresses]); // Convert readonly array to mutable array
            setLoading(false);
        }
        fetchPools();
    }, []);

    if (!account) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-300 mb-6">You need to connect your wallet to view pools</p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">SusuFlow</h1>
                    </Link>
                    <WalletConnect />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Active Pools</h2>
                    <Link
                        href="/pools/create"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                    >
                        + Create Pool
                    </Link>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-pulse">
                                <div className="h-6 bg-white/10 rounded mb-4"></div>
                                <div className="h-4 bg-white/10 rounded mb-2"></div>
                                <div className="h-4 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : pools.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                        <div className="text-6xl mb-4">🏊‍♂️</div>
                        <h3 className="text-2xl font-semibold text-white mb-2">No Pools Yet</h3>
                        <p className="text-gray-400 mb-6">
                            Be the first to create a savings pool on SusuFlow!
                        </p>
                        <Link
                            href="/pools/create"
                            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                        >
                            Create First Pool
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pools.map((poolAddress) => (
                            <PoolCard key={poolAddress} address={poolAddress} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
