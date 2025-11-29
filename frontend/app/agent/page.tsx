'use client';

import { useEffect, useState } from 'react';
import { getAllPools } from '@/lib/contracts/factory';
import { getPoolInfo, getPoolMembersWithStatus } from '@/lib/contracts/pool';
import { formatUnits } from 'ethers';
import Link from 'next/link';

interface PoolHealth {
    address: string;
    isActive: boolean;
    currentRound: number;
    nextPayoutTime: number;
    memberCount: number;
    maxMembers: number;
    missingPayments: number;
    status: 'HEALTHY' | 'ACTION_NEEDED' | 'OVERDUE' | 'COMPLETED';
    nextAction: string;
}

export default function AgentDashboard() {
    const [pools, setPools] = useState<PoolHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchPools = async () => {
        setLoading(true);
        try {
            const poolAddresses = await getAllPools();
            const healthData: PoolHealth[] = [];

            for (const address of poolAddresses) {
                const info = await getPoolInfo(address);
                if (!info) continue;

                const members = await getPoolMembersWithStatus(address, info.currentRound, info.contributionAmount);
                const missing = members.filter(m => !m.hasContributed).length;

                const now = Date.now() / 1000;
                let status: PoolHealth['status'] = 'HEALTHY';
                let nextAction = 'Waiting for time';

                if (!info.isActive) {
                    status = 'COMPLETED';
                    nextAction = 'None';
                } else if (now >= Number(info.nextPayoutTime)) {
                    if (missing === 0) {
                        status = 'ACTION_NEEDED';
                        nextAction = 'Trigger Payout';
                    } else {
                        status = 'OVERDUE';
                        nextAction = `Wait for ${missing} payments`;
                    }
                } else {
                    if (missing > 0) {
                        nextAction = `Waiting for ${missing} payments`;
                    }
                }

                healthData.push({
                    address,
                    isActive: info.isActive,
                    currentRound: Number(info.currentRound),
                    nextPayoutTime: Number(info.nextPayoutTime),
                    memberCount: Number(info.memberCount),
                    maxMembers: Number(info.maxMembers),
                    missingPayments: missing,
                    status,
                    nextAction
                });
            }

            setPools(healthData);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch pools:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPools();
        const interval = setInterval(fetchPools, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0d111c] pt-24 pb-12">
            <main className="container mx-auto px-4 max-w-6xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">🤖 NoahAI Agent View</h1>
                        <p className="text-gray-400">Real-time monitoring of all active pools</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Last Scan</p>
                            <p className="text-white font-mono">{lastRefresh.toLocaleTimeString()}</p>
                        </div>
                        <button
                            onClick={fetchPools}
                            disabled={loading}
                            className="bg-[#131a2a] hover:bg-[#1c2438] text-white px-4 py-2 rounded-xl border border-white/10 transition-colors"
                        >
                            {loading ? 'Scanning...' : 'Refresh Now'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#131a2a] p-6 rounded-[24px] border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Total Pools</p>
                        <p className="text-3xl font-bold text-white">{pools.length}</p>
                    </div>
                    <div className="bg-[#131a2a] p-6 rounded-[24px] border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Active</p>
                        <p className="text-3xl font-bold text-blue-400">
                            {pools.filter(p => p.isActive).length}
                        </p>
                    </div>
                    <div className="bg-[#131a2a] p-6 rounded-[24px] border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Action Needed</p>
                        <p className="text-3xl font-bold text-green-400">
                            {pools.filter(p => p.status === 'ACTION_NEEDED').length}
                        </p>
                    </div>
                    <div className="bg-[#131a2a] p-6 rounded-[24px] border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Overdue</p>
                        <p className="text-3xl font-bold text-red-400">
                            {pools.filter(p => p.status === 'OVERDUE').length}
                        </p>
                    </div>
                </div>

                {/* Pools Table */}
                <div className="bg-[#131a2a] rounded-[32px] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pool Address</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Round</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Members</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Next Payout</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Agent Action</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pools.map((pool) => (
                                    <tr key={pool.address} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm text-white">{pool.address.slice(0, 6)}...{pool.address.slice(-4)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {pool.status === 'HEALTHY' && <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">Healthy</span>}
                                            {pool.status === 'ACTION_NEEDED' && <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/20 animate-pulse">Action Needed</span>}
                                            {pool.status === 'OVERDUE' && <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/20">Overdue</span>}
                                            {pool.status === 'COMPLETED' && <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/20">Completed</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            #{pool.currentRound}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {pool.memberCount} / {pool.maxMembers}
                                            {pool.missingPayments > 0 && (
                                                <span className="ml-2 text-xs text-red-400">({pool.missingPayments} unpaid)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {pool.nextPayoutTime === 0 ? 'Not Started' : new Date(pool.nextPayoutTime * 1000).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {pool.nextAction}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/pools/${pool.address}`} className="text-purple-400 hover:text-purple-300">
                                                Details →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {pools.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No pools found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
