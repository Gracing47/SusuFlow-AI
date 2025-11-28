'use client';

import { useEffect, useState } from 'react';
import { getPoolInfo } from '@/lib/contracts/pool';
import { formatUnits } from 'ethers';
import Link from 'next/link';

interface PoolCardProps {
    address: string;
}

export function PoolCard({ address }: PoolCardProps) {
    const [poolData, setPoolData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPoolData() {
            const data = await getPoolInfo(address);
            setPoolData(data);
            setLoading(false);
        }
        fetchPoolData();
    }, [address]);

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded"></div>
            </div>
        );
    }

    if (!poolData) {
        return null;
    }

    const contributionAmount = formatUnits(poolData.contributionAmount, 18);
    const memberCount = Number(poolData.memberCount);
    const isActive = poolData.isActive;
    const nextPayout = new Date(Number(poolData.nextPayoutTime) * 1000);

    return (
        <Link href={`/pools/${address}`}>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-white font-semibold">
                        Pool {address.slice(0, 6)}...{address.slice(-4)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                        <span>💰 Contribution:</span>
                        <span className="text-white font-semibold">{contributionAmount} cUSD</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>👥 Members:</span>
                        <span className="text-white font-semibold">{memberCount}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>📅 Next Payout:</span>
                        <span className="text-white font-semibold">{nextPayout.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>🎁 Pot Size:</span>
                        <span className="text-white font-semibold">{(Number(contributionAmount) * memberCount).toFixed(2)} cUSD</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
