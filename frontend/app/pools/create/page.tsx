'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prepareCreatePool } from '@/lib/contracts/factory';
import { parseUnits } from 'ethers';

export default function CreatePoolPage() {
    const account = useActiveAccount();
    const router = useRouter();
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        tokenType: 'native', // 'native' for CELO or 'cusd' for cUSD
        contributionAmount: '1',
        totalMembers: '3',
        cycleDuration: '15',
        timeUnit: 'minutes', // 'minutes' or 'days'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert to seconds based on time unit
        const durationInSeconds = formData.timeUnit === 'minutes'
            ? Number(formData.cycleDuration) * 60
            : Number(formData.cycleDuration) * 24 * 60 * 60;

        // Check minimum duration (15 minutes = 900 seconds)
        const MIN_DURATION = 900; // 15 minutes in seconds
        if (durationInSeconds < MIN_DURATION) {
            alert(`⚠️ Cycle duration must be at least 15 minutes (900 seconds).\n\nYour current setting: ${durationInSeconds} seconds\n\nPlease use at least 15 minutes.`);
            return;
        }

        setIsCreating(true);

        try {
            // Determine token address based on selection
            const tokenAddress = formData.tokenType === 'native'
                ? '0x0000000000000000000000000000000000000000' // address(0) for native CELO
                : '0x765DE816845861e75A25fCA122bb6898B8B1282a'; // cUSD on Celo Mainnet

            // Convert values to contract format
            const contributionAmount = parseUnits(formData.contributionAmount, 18); // Both CELO and cUSD have 18 decimals
            const cycleDuration = BigInt(durationInSeconds);
            const totalMembers = BigInt(formData.totalMembers);

            // Prepare the transaction with token address
            const transaction = prepareCreatePool(tokenAddress, contributionAmount, cycleDuration, totalMembers);

            // Send transaction
            sendTransaction(transaction, {
                onSuccess: (result) => {
                    console.log('Pool created!', result);
                    alert(`Pool created successfully! Transaction: ${result.transactionHash}`);
                    router.push('/pools');
                },
                onError: (error) => {
                    console.error('Error creating pool:', error);
                    alert('Failed to create pool: ' + error.message);
                    setIsCreating(false);
                },
            });
        } catch (error: any) {
            console.error('Error preparing transaction:', error);
            alert('Failed to prepare transaction: ' + error.message);
            setIsCreating(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-300 mb-6">You need to connect your wallet to create a pool</p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    const tokenSymbol = formData.tokenType === 'native' ? 'CELO' : 'cUSD';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">


            <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
                <div className="mb-8">
                    <Link href="/pools" className="text-purple-400 hover:text-purple-300">
                        ← Back to Pools
                    </Link>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <h2 className="text-3xl font-bold text-white mb-6">Create New Pool</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Token Type Selector */}
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Payment Token
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tokenType: 'native' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.tokenType === 'native'
                                        ? 'border-purple-500 bg-purple-500/20'
                                        : 'border-white/20 bg-white/5 hover:border-white/40'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🪙</div>
                                        <div className="text-white font-semibold">Native CELO</div>
                                        <div className="text-gray-400 text-sm">Easier, no approval</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tokenType: 'cusd' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.tokenType === 'cusd'
                                        ? 'border-purple-500 bg-purple-500/20'
                                        : 'border-white/20 bg-white/5 hover:border-white/40'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">💵</div>
                                        <div className="text-white font-semibold">cUSD</div>
                                        <div className="text-gray-400 text-sm">Stablecoin</div>
                                    </div>
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                {formData.tokenType === 'native'
                                    ? '✨ Recommended: Send CELO directly, no token approval needed'
                                    : '📝 Requires token approval before each contribution'}
                            </p>
                        </div>

                        {/* Contribution Amount */}
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Contribution Amount ({tokenSymbol})
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={formData.contributionAmount}
                                onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="1"
                                required
                            />
                            <p className="text-gray-400 text-sm mt-1">
                                Minimum 0.1 {tokenSymbol} - How much each member contributes per cycle
                            </p>
                        </div>

                        {/* Total Members */}
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Total Members
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="20"
                                value={formData.totalMembers}
                                onChange={(e) => setFormData({ ...formData, totalMembers: e.target.value })}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="3"
                                required
                            />
                            <p className="text-gray-400 text-sm mt-1">
                                Maximum number of participants (2-20)
                            </p>
                        </div>

                        {/* Cycle Duration with Time Unit Selector */}
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Cycle Duration
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={formData.timeUnit === 'minutes' ? '15' : '1'}
                                    max={formData.timeUnit === 'minutes' ? '1440' : '365'}
                                    value={formData.cycleDuration}
                                    onChange={(e) => setFormData({ ...formData, cycleDuration: e.target.value })}
                                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="15"
                                    required
                                />
                                <select
                                    value={formData.timeUnit}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        timeUnit: e.target.value,
                                        cycleDuration: e.target.value === 'minutes' ? '15' : '1'
                                    })}
                                    className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="minutes">Minutes</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                                {formData.timeUnit === 'minutes'
                                    ? 'Minimum 15 minutes for testing - How often payouts occur'
                                    : 'Minimum 1 day - How often payouts occur'}
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-2">Pool Summary</h3>
                            <ul className="space-y-1 text-gray-300">
                                <li>💰 Each member pays: <span className="text-white font-semibold">{formData.contributionAmount} {tokenSymbol}</span></li>
                                <li>👥 Total members: <span className="text-white font-semibold">{formData.totalMembers}</span></li>
                                <li>📅 Payout every: <span className="text-white font-semibold">{formData.cycleDuration} {formData.timeUnit}</span></li>
                                <li>🎁 Pot size: <span className="text-white font-semibold">{(Number(formData.contributionAmount) * Number(formData.totalMembers)).toFixed(2)} {tokenSymbol}</span></li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isCreating || isPending}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating || isPending ? 'Creating Pool...' : 'Create Pool'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
