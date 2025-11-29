'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prepareCreatePool } from '@/lib/contracts/factory';
import { parseUnits } from 'ethers';
import toast from 'react-hot-toast';

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert to seconds based on time unit
        const durationInSeconds = formData.timeUnit === 'minutes'
            ? Number(formData.cycleDuration) * 60
            : Number(formData.cycleDuration) * 24 * 60 * 60;

        // Check minimum duration (15 minutes = 900 seconds)
        const MIN_DURATION = 900; // 15 minutes in seconds
        if (durationInSeconds < MIN_DURATION) {
            toast.error(`⚠️ Cycle duration must be at least 15 minutes.\n\nYour current setting: ${durationInSeconds} seconds\n\nPlease use at least 15 minutes.`);
            return;
        }

        setIsCreating(true);
        const toastId = toast.loading('Creating pool...');

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
                    toast.success(`🎉 Pool created successfully!`, { id: toastId, duration: 5000 });

                    // Auto-redirect and refresh after short delay
                    setTimeout(() => {
                        router.push('/pools');
                        router.refresh();
                    }, 1500);
                },
                onError: (error) => {
                    console.error('Error creating pool:', error);
                    toast.error(`Failed to create pool: ${error.message}`, { id: toastId });
                    setIsCreating(false);
                },
            });
        } catch (error: any) {
            console.error('Error preparing transaction:', error);
            toast.error(`Failed to prepare transaction: ${error.message}`, { id: toastId });
            setIsCreating(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-[#0d111c] flex items-center justify-center">
                <div className="bg-[#131a2a] rounded-[32px] p-8 border border-white/5 text-center max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-400 mb-6">You need to connect your wallet to create a pool</p>
                    <div className="flex justify-center">
                        <WalletConnect />
                    </div>
                </div>
            </div>
        );
    }

    const tokenSymbol = formData.tokenType === 'native' ? 'CELO' : 'cUSD';

    return (
        <div className="min-h-screen bg-[#0d111c] pt-24 pb-12">
            <main className="container mx-auto px-4 max-w-lg">
                <div className="mb-6">
                    <Link href="/pools" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Pools
                    </Link>
                </div>

                <div className="bg-[#131a2a] rounded-[24px] p-6 border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Create Pool</h1>
                        <div className="w-8 h-8 rounded-full bg-[#1b2236] flex items-center justify-center text-gray-400">
                            ⚙️
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Contribution Amount */}
                        <div className="bg-[#0d111c] p-4 rounded-[20px] border border-white/5 hover:border-white/10 transition-colors">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Contribution Amount</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="contributionAmount"
                                    value={formData.contributionAmount}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent text-3xl font-medium text-white placeholder-gray-600 focus:outline-none"
                                    placeholder="0.0"
                                    step="0.01"
                                    required
                                />
                                <div className="bg-[#1b2236] px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5 shrink-0">
                                    <span className="font-bold text-white">{tokenSymbol}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Members */}
                        <div className="bg-[#0d111c] p-4 rounded-[20px] border border-white/5 hover:border-white/10 transition-colors">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Total Members</label>
                            <input
                                type="number"
                                name="totalMembers"
                                min="2"
                                max="20"
                                value={formData.totalMembers}
                                onChange={handleInputChange}
                                className="w-full bg-transparent text-3xl font-medium text-white placeholder-gray-600 focus:outline-none"
                                placeholder="3"
                                required
                            />
                        </div>

                        {/* Payout Interval */}
                        <div className="bg-[#0d111c] p-4 rounded-[20px] border border-white/5 hover:border-white/10 transition-colors">
                            <label className="block text-gray-400 text-sm font-medium mb-2">Payout Interval</label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    name="cycleDuration"
                                    value={formData.cycleDuration}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent text-3xl font-medium text-white placeholder-gray-600 focus:outline-none"
                                    placeholder="15"
                                    required
                                />
                                <select
                                    name="timeUnit"
                                    value={formData.timeUnit}
                                    onChange={handleInputChange}
                                    className="bg-[#1b2236] text-white border-none rounded-xl px-4 py-2 focus:ring-0 cursor-pointer"
                                >
                                    <option value="minutes">Minutes</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>

                        {/* Token Type Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, tokenType: 'native' })}
                                className={`p-4 rounded-[20px] border transition-all flex flex-col items-center gap-2 ${formData.tokenType === 'native'
                                        ? 'bg-[#1b2236] border-purple-500/50 text-white'
                                        : 'bg-[#0d111c] border-white/5 text-gray-400 hover:bg-[#1b2236]'
                                    }`}
                            >
                                <span className="text-2xl">🪙</span>
                                <span className="font-medium">CELO</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, tokenType: 'cUSD' })}
                                className={`p-4 rounded-[20px] border transition-all flex flex-col items-center gap-2 ${formData.tokenType === 'cUSD'
                                        ? 'bg-[#1b2236] border-green-500/50 text-white'
                                        : 'bg-[#0d111c] border-white/5 text-gray-400 hover:bg-[#1b2236]'
                                    }`}
                            >
                                <span className="text-2xl">💵</span>
                                <span className="font-medium">cUSD</span>
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="bg-[#1b2236]/50 rounded-[20px] p-4 border border-white/5">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Pot Size</span>
                                <span className="text-white font-bold">{(Number(formData.contributionAmount) * Number(formData.totalMembers)).toFixed(2)} {tokenSymbol}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Est. Duration</span>
                                <span className="text-white font-bold">{Number(formData.totalMembers) * Number(formData.cycleDuration)} {formData.timeUnit}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-[#4c82fb] hover:bg-[#3b6dcf] disabled:bg-[#1b2236] disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-[20px] text-xl transition-all mt-4 active:scale-[0.98]"
                        >
                            {isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating Pool...
                                </span>
                            ) : (
                                'Create Pool'
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
