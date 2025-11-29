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
            <div className="bg-[#131a2a] rounded-[24px] p-6 border border-white/5 animate-pulse">
                <div className="h-6 bg-[#0d111c] rounded mb-4"></div>
                <div className="h-4 bg-[#0d111c] rounded mb-2"></div>
                <div className="h-4 bg-[#0d111c] rounded"></div>
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
            <div className="bg-[#131a2a] rounded-[24px] p-6 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 cursor-pointer shadow-lg hover:shadow-xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1">
                            Pool {address.slice(0, 6)}...
                        </h3>
                        <p className="text-gray-500 text-xs font-mono">{address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#0d111c] rounded-[16px]">
                        <span className="text-gray-400 text-sm">Contribution</span>
                        <span className="text-white font-bold">{contributionAmount} CELO/cUSD</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#0d111c] rounded-[16px]">
                            <span className="text-gray-400 text-xs block mb-1">Members</span>
                            <span className="text-white font-bold">{memberCount}</span>
                        </div>
                        <div className="p-3 bg-[#0d111c] rounded-[16px]">
                            <span className="text-gray-400 text-xs block mb-1">Pot Size</span>
                            <span className="text-white font-bold">{(Number(contributionAmount) * memberCount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <span>📅 Next Payout:</span>
                        <span className="text-gray-300">{nextPayout.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
