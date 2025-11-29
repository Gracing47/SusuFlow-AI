'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { getContract, prepareContractCall } from 'thirdweb';
import { celo } from 'thirdweb/chains';
import { client } from '@/lib/client';
import { getPoolInfo, getPoolMembersWithStatus, prepareJoinPool, prepareContribute, prepareDistributePot, getPoolTokenInfo } from '@/lib/contracts/pool';
import { formatUnits } from 'ethers';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ConnectButton } from 'thirdweb/react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { approve } from "thirdweb/extensions/erc20";

export default function PoolDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const account = useActiveAccount();
    const router = useRouter();
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    const [pool, setPool] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);
    const [userHasContributed, setUserHasContributed] = useState(false);
    const [isNativeToken, setIsNativeToken] = useState(true);
    const [tokenAddress, setTokenAddress] = useState('');

    const refreshPoolData = async () => {
        try {
            const [poolData, tokenInfo] = await Promise.all([
                getPoolInfo(id),
                getPoolTokenInfo(id)
            ]);

            if (poolData) {
                setPool(poolData);
                setIsNativeToken(tokenInfo.isNativeToken);
                setTokenAddress(tokenInfo.tokenAddress);

                const membersData = await getPoolMembersWithStatus(id, poolData.currentRound, poolData.contributionAmount);
                setMembers(membersData);

                if (account) {
                    const userMember = membersData.find(
                        (m) => m.address.toLowerCase() === account.address.toLowerCase()
                    );
                    setIsMember(!!userMember);
                    if (userMember) {
                        setUserHasContributed(userMember.hasContributed);
                    }
                }
            }
        } catch (err) {
            console.error('Error refreshing pool data:', err);
        }
    };

    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            try {
                const [poolData, tokenInfo] = await Promise.all([
                    getPoolInfo(id),
                    getPoolTokenInfo(id)
                ]);

                if (!poolData) {
                    setError('Failed to load pool data');
                } else {
                    setPool(poolData);
                    setIsNativeToken(tokenInfo.isNativeToken);
                    setTokenAddress(tokenInfo.tokenAddress);

                    const membersData = await getPoolMembersWithStatus(id, poolData.currentRound, poolData.contributionAmount);
                    setMembers(membersData);

                    // Check contribution status if account exists
                    if (account) {
                        const userMember = membersData.find(
                            (m) => m.address.toLowerCase() === account.address.toLowerCase()
                        );
                        setIsMember(!!userMember);

                        if (userMember) {
                            setUserHasContributed(userMember.hasContributed);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching pool details');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, account]);

    const handleJoin = async () => {
        if (!account) return;
        const toastId = toast.loading('Joining pool...');
        try {
            const transaction = prepareJoinPool(id);
            await sendTransaction(transaction);
            toast.success('🎉 Successfully joined the pool!', { id: toastId });

            // Auto-refresh pool data
            setTimeout(async () => {
                await refreshPoolData();
                router.refresh();
            }, 1500);
        } catch (err: any) {
            console.error(err);
            let message = err.message || 'Unknown error';

            if (message.includes('PoolNotStarted')) {
                message = 'This pool has already started and cannot accept new members.';
            } else if (message.includes('PoolFull')) {
                message = 'This pool is full.';
            } else if (message.includes('AlreadyMember')) {
                message = 'You are already a member of this pool.';
            }

            toast.error(`Failed to join pool: ${message}`, { id: toastId });
        }
    };

    const handleContribute = async () => {
        if (!pool || !account) return;
        const toastId = toast.loading(isNativeToken ? 'Processing contribution...' : 'Step 1/2: Approving tokens...');

        try {
            if (isNativeToken) {
                // Native CELO: send value directly with transaction
                const transaction = prepareContribute(id, pool.contributionAmount);
                await sendTransaction(transaction);
                toast.success('💰 Contribution successful!', { id: toastId });

                // Auto-refresh pool data
                setTimeout(async () => {
                    await refreshPoolData();
                    router.refresh();
                }, 1500);
            } else {
                // ERC20 (cUSD): approve first, then contribute
                // 1. Approve token spending
                const tokenContract = getContract({
                    client,
                    chain: celo,
                    address: tokenAddress,
                });

                const approveTx = approve({
                    contract: tokenContract,
                    spender: id,
                    amount: pool.contributionAmount,
                });

                await sendTransaction(approveTx);
                toast.loading('Step 2/2: Contributing...', { id: toastId });

                // 2. Call contribute
                const transaction = prepareContribute(id);
                await sendTransaction(transaction);

                toast.success('💰 Contribution successful!', { id: toastId });

                // Auto-refresh pool data
                setTimeout(async () => {
                    await refreshPoolData();
                    router.refresh();
                }, 1500);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(`Contribution failed: ${err.message}`, { id: toastId });
        }
    };

    const handleDistribute = async () => {
        if (!account) return;
        const toastId = toast.loading('Distributing pot...');
        try {
            const transaction = prepareDistributePot(id);
            await sendTransaction(transaction);
            toast.success('🏆 Pot distributed successfully!', { id: toastId });

            // Auto-refresh pool data
            setTimeout(async () => {
                await refreshPoolData();
                router.refresh();
            }, 1500);
        } catch (err: any) {
            console.error(err);
            let message = err.message || 'Unknown error';
            if (message.includes('AllMembersNotContributed')) {
                message = 'Cannot distribute pot: Not all members have contributed yet.';
            } else if (message.includes('PayoutNotReady')) {
                message = 'Payout is not ready yet (time not reached).';
            }
            toast.error(`Failed to distribute pot: ${message}`, { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d111c] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!pool) {
        return (
            <div className="min-h-screen bg-[#0d111c] flex items-center justify-center">
                <div className="text-white text-xl">Pool not found</div>
            </div>
        );
    }

    const tokenSymbol = isNativeToken ? 'CELO' : 'cUSD';

    return (
        <div className="min-h-screen bg-[#0d111c] pt-24 pb-12">
            <main className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6">
                    <Link href="/pools" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Pools
                    </Link>
                </div>

                {/* Header Card */}
                <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 shadow-xl mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-white">Pool Details</h1>
                                {pool.isActive ? (
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/20">
                                        Active
                                    </span>
                                ) : (
                                    <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm font-medium border border-gray-500/20">
                                        Completed
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 font-mono text-sm break-all">{id}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0d111c] px-4 py-2 rounded-full border border-white/5">
                            <span className="text-2xl">{isNativeToken ? '🪙' : '💵'}</span>
                            <span className="font-bold text-white">{tokenSymbol} Pool</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#0d111c] p-5 rounded-[24px] border border-white/5 flex flex-col justify-center">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Contribution</p>
                            <p className="text-xl font-bold text-white truncate" title={`${formatUnits(pool.contributionAmount, 18)} ${tokenSymbol}`}>
                                {formatUnits(pool.contributionAmount, 18)} <span className="text-sm font-normal text-gray-500">{tokenSymbol}</span>
                            </p>
                        </div>
                        <div className="bg-[#0d111c] p-5 rounded-[24px] border border-white/5 flex flex-col justify-center">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pot Size</p>
                            <p className="text-xl font-bold text-white truncate">
                                {formatUnits(pool.contributionAmount * pool.maxMembers, 18)} <span className="text-sm font-normal text-gray-500">{tokenSymbol}</span>
                            </p>
                        </div>
                        <div className="bg-[#0d111c] p-5 rounded-[24px] border border-white/5 flex flex-col justify-center">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Members</p>
                            <p className="text-xl font-bold text-white">
                                {pool.memberCount.toString()} <span className="text-gray-500 text-lg">/ {pool.maxMembers.toString()}</span>
                            </p>
                        </div>
                        <div className="bg-[#0d111c] p-5 rounded-[24px] border border-white/5 flex flex-col justify-center">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Round</p>
                            <p className="text-xl font-bold text-white">#{pool.currentRound.toString()}</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Main Actions Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Timer Card */}
                        <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span>⏱️</span> Next Payout
                            </h3>
                            {Number(pool.nextPayoutTime) === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-2xl font-bold text-gray-400">Pool Not Started</p>
                                    <p className="text-gray-500 mt-2">Waiting for members to join...</p>
                                </div>
                            ) : Number(pool.nextPayoutTime) * 1000 < Date.now() ? (
                                <div className="text-center py-8 bg-green-500/10 rounded-[24px] border border-green-500/20">
                                    <p className="text-3xl font-bold text-green-400 mb-2">Payout Ready! 💰</p>
                                    <p className="text-green-500/60">The pot can now be distributed.</p>
                                </div>
                            ) : (
                                <CountdownTimer targetDate={new Date(Number(pool.nextPayoutTime) * 1000)} />
                            )}
                        </div>

                        {/* Members List */}
                        <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>👥</span> Members
                                </h3>
                                <span className="text-sm text-gray-400 bg-[#0d111c] px-3 py-1 rounded-full border border-white/5">
                                    {members.length} Joined
                                </span>
                            </div>
                            <div className="space-y-3">
                                {members.map((member, index) => (
                                    <div
                                        key={member.address}
                                        className="flex items-center justify-between p-4 bg-[#0d111c] rounded-[20px] border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-white font-mono font-medium">
                                                    {member.address.slice(0, 6)}...{member.address.slice(-4)}
                                                    {member.address.toLowerCase() === account?.address.toLowerCase() && (
                                                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wide">You</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">Member since Round 1</p>
                                            </div>
                                        </div>
                                        {member.hasContributed ? (
                                            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-green-400 text-sm font-bold">Paid</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span className="text-yellow-400 text-sm font-bold">Pending</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {Array.from({ length: Number(pool.maxMembers) - members.length }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-4 border-2 border-dashed border-white/5 rounded-[20px] flex items-center justify-center text-gray-600 font-medium bg-[#0d111c]/30">
                                        Empty Slot
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <div className="bg-[#131a2a] rounded-[32px] p-6 border border-white/5 shadow-xl sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6">Actions</h3>

                            {!isMember ? (
                                <button
                                    onClick={handleJoin}
                                    disabled={isPending || Number(pool.memberCount) >= Number(pool.maxMembers)}
                                    className="w-full bg-[#4c82fb] hover:bg-[#3b6dcf] disabled:bg-[#1b2236] disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-[20px] text-lg transition-all active:scale-[0.98]"
                                >
                                    {isPending ? 'Joining...' : 'Join Pool'}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    {userHasContributed ? (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-[20px] p-6 text-center">
                                            <div className="text-4xl mb-2">✅</div>
                                            <h4 className="text-green-400 font-bold mb-1">Contribution Paid</h4>
                                            <p className="text-green-500/60 text-sm">You're all set for this round!</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleContribute}
                                            disabled={isPending}
                                            className="w-full bg-[#4c82fb] hover:bg-[#3b6dcf] disabled:bg-[#1b2236] disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-[20px] text-lg transition-all active:scale-[0.98]"
                                        >
                                            {isPending ? 'Processing...' : `Pay ${formatUnits(pool.contributionAmount, 18)} ${tokenSymbol}`}
                                        </button>
                                    )}

                                    {/* Distribute Button (Only visible if round is complete) */}
                                    <button
                                        onClick={handleDistribute}
                                        disabled={isPending}
                                        className="w-full bg-[#1b2236] hover:bg-[#293249] text-white font-bold py-4 px-6 rounded-[20px] text-lg transition-all border border-white/5 active:scale-[0.98]"
                                    >
                                        Distribute Pot
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
