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
        contributionAmount: '1',
        totalMembers: '3',
        cycleDuration: '15',
        timeUnit: 'minutes', // 'minutes' or 'days'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            // Convert values to contract format
            const contributionAmount = parseUnits(formData.contributionAmount, 18); // cUSD has 18 decimals

            // Convert to seconds based on time unit
            const durationInSeconds = formData.timeUnit === 'minutes'
                ? Number(formData.cycleDuration) * 60
                : Number(formData.cycleDuration) * 24 * 60 * 60;

            const cycleDuration = BigInt(durationInSeconds);
            const totalMembers = BigInt(formData.totalMembers);

            // Prepare the transaction
            const transaction = prepareCreatePool(contributionAmount, cycleDuration, totalMembers);

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

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <Link href="/pools" className="text-purple-400 hover:text-purple-300">
                        ← Back to Pools
                    </Link>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <h2 className="text-3xl font-bold text-white mb-6">Create New Pool</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Contribution Amount */}
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Contribution Amount (cUSD)
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
                                Minimum 0.1 cUSD - How much each member contributes per cycle
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
                                    : 'How often payouts occur (in days)'}
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-2">Pool Summary</h3>
                            <ul className="space-y-1 text-gray-300">
                                <li>💰 Each member pays: <span className="text-white font-semibold">{formData.contributionAmount} cUSD</span></li>
                                <li>👥 Total members: <span className="text-white font-semibold">{formData.totalMembers}</span></li>
                                <li>📅 Payout every: <span className="text-white font-semibold">{formData.cycleDuration} {formData.timeUnit}</span></li>
                                <li>🎁 Pot size: <span className="text-white font-semibold">{(Number(formData.contributionAmount) * Number(formData.totalMembers)).toFixed(2)} cUSD</span></li>
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
