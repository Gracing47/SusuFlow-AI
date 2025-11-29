'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPoolInfo, getPoolMembersWithStatus, getPoolTokenInfo, prepareContribute, prepareJoinPool, prepareDistributePot } from '@/lib/contracts/pool';
import { ConnectButton, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { client } from '@/lib/client';
import { getContract } from 'thirdweb';
import { celo } from 'thirdweb/chains';
import { approve } from 'thirdweb/extensions/erc20';
import { CountdownTimer } from '@/components/CountdownTimer';
import toast from 'react-hot-toast';

export default function PoolDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const account = useActiveAccount();
    const { mutateAsync: sendTransaction, isPending } = useSendTransaction();

    const [pool, setPool] = useState<any>(null);
    const [members, setMembers] = useState<{ address: string, hasContributed: boolean }[]>([]);
    const [userHasContributed, setUserHasContributed] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isNativeToken, setIsNativeToken] = useState(false);
    const [tokenAddress, setTokenAddress] = useState('');

    // Function to refresh pool data
    const refreshPoolData = async () => {
        if (!id) return;
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
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error || !pool) {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
                <div className="text-red-500">{error || 'Pool not found'}</div>
            </div>
        );
    }

    const contributionAmount = formatUnits(pool.contributionAmount, 18);
    const potSize = formatUnits(pool.potBalance, 18);
    const nextPayoutDate = new Date(Number(pool.nextPayoutTime) * 1000);
    const isPayoutReady = Date.now() >= nextPayoutDate.getTime();
    const tokenSymbol = isNativeToken ? 'CELO' : 'cUSD';

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-md mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                                Pool Details
                            </h1>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                    Verified by Self
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${isNativeToken
                                    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                    : 'bg-green-500/10 border border-green-500/20 text-green-400'
                                    }`}>
                                    {isNativeToken ? '🪙 CELO' : '💵 cUSD'}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm break-all font-mono opacity-60">
                            {id}
                        </p>
                    </div>

                    {/* Countdown Section */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-4 border border-purple-500/20">
                        <div className="text-center mb-3">
                            <span className="text-gray-400 text-xs uppercase tracking-widest">Next Payout In</span>
                        </div>
                        <CountdownTimer targetDate={nextPayoutDate} />
                    </div>
                </div>

                {/* Main Stats Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl">
                            <div className="text-gray-400 text-xs mb-1">Contribution</div>
                            <div className="text-xl font-bold text-white">{contributionAmount} {tokenSymbol}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl">
                            <div className="text-gray-400 text-xs mb-1">Pot Balance</div>
                            <div className="text-xl font-bold text-purple-400">{potSize} {tokenSymbol}</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pool.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {pool.isActive ? 'Active' : 'Completed'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Current Round</span>
                            <span className="text-white font-medium">#{pool.currentRound.toString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Cycle Duration</span>
                            <span className="text-white font-medium">
                                {(Number(pool.cycleDuration) / 86400).toFixed(1)} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Members ({members.length})</h2>
                    <div className="space-y-3">
                        {members.map((member, index) => (
                            <div key={member.address} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <span className="text-sm text-gray-300">
                                        {member.address.slice(0, 6)}...{member.address.slice(-4)}
                                        {member.address.toLowerCase() === account?.address.toLowerCase() && ' (You)'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {member.hasContributed ? (
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                                            Paid
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                                            Pending
                                        </span>
                                    )}
                                    {pool.currentWinner.toLowerCase() === member.address.toLowerCase() && (
                                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">
                                            Winner 👑
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                {pool.isActive && (
                    <div className="pt-4 space-y-3">
                        {isPayoutReady && (
                            <button
                                onClick={handleDistribute}
                                disabled={isPending}
                                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl font-bold text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                            >
                                {isPending ? 'Processing...' : '🏆 Distribute Pot'}
                            </button>
                        )}

                        {!account ? (
                            <ConnectButton client={client} chain={celo} />
                        ) : !isMember ? (
                            <button
                                onClick={handleJoin}
                                disabled={isPending}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? 'Processing...' : 'Join Pool'}
                            </button>
                        ) : userHasContributed ? (
                            <button
                                disabled
                                className="w-full py-4 bg-green-500/20 text-green-400 rounded-2xl font-bold border border-green-500/50 cursor-not-allowed"
                            >
                                ✅ Contribution Paid for Round #{pool.currentRound.toString()}
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={handleContribute}
                                    disabled={isPending}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? 'Processing...' : `Pay Contribution (${contributionAmount} ${tokenSymbol})`}
                                </button>
                                {!isNativeToken && (
                                    <p className="text-xs text-gray-400 text-center">
                                        💡 You'll need to approve {tokenSymbol} spending first
                                    </p>
                                )}
                                {isNativeToken && (
                                    <p className="text-xs text-green-400 text-center">
                                        ✨ No approval needed - just sign the transaction!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
