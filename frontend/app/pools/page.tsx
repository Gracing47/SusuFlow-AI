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
    const [refreshing, setRefreshing] = useState(false);

    const fetchPools = async () => {
        try {
            const poolAddresses = await getAllPools();
            setPools([...poolAddresses]);
        } catch (error) {
            console.error('Failed to fetch pools:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPools();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchPools, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPools();
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-[#0d111c] flex items-center justify-center">
                <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 text-center max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-400 mb-6">You need to connect your wallet to view pools</p>
                    <div className="flex justify-center">
                        <WalletConnect />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d111c] pt-24 pb-12">
            <main className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-white">Active Pools</h2>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 bg-[#131a2a] hover:bg-[#293249] border border-white/5 rounded-xl transition-colors disabled:opacity-50 text-gray-400 hover:text-white"
                            title="Refresh pools"
                        >
                            <svg
                                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <Link
                        href="/pools/create"
                        className="bg-[#4c82fb] hover:bg-[#3b6dcf] text-white px-6 py-3 rounded-[20px] font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        + Create Pool
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-[#131a2a] rounded-[32px] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : pools.length === 0 ? (
                    <div className="text-center py-20 bg-[#131a2a] rounded-[32px] border border-white/5">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Active Pools</h3>
                        <p className="text-gray-400 mb-8">Be the first to start a savings circle!</p>
                        <Link
                            href="/pools/create"
                            className="bg-[#4c82fb] hover:bg-[#3b6dcf] text-white px-8 py-4 rounded-[24px] font-semibold transition-all"
                        >
                            Create First Pool
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pools.map((address) => (
                            <PoolCard key={address} address={address} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
