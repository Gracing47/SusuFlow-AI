'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount, useSendTransaction, ConnectButton } from 'thirdweb/react';
import { isUserVerified, prepareVerifyUser } from '@/lib/contracts/verification';
import { client, celo } from '@/lib/client';
import Link from 'next/link';

export default function VerifyPage() {
    const account = useActiveAccount();
    const { mutateAsync: sendTransaction, isPending } = useSendTransaction();
    const [isVerified, setIsVerified] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        async function checkVerification() {
            if (!account) {
                setIsChecking(false);
                return;
            }

            setIsChecking(true);
            const verified = await isUserVerified(account.address);
            setIsVerified(verified);
            setIsChecking(false);
        }

        checkVerification();
    }, [account]);

    const handleVerify = async () => {
        if (!account) return;

        try {
            const transaction = prepareVerifyUser(account.address);
            await sendTransaction(transaction);
            alert('✅ Verification successful! You can now create pools.');
            setIsVerified(true);
        } catch (error: any) {
            console.error(error);
            alert('❌ Verification failed: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[0%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

            <main className="container mx-auto px-4 pt-32 pb-20 relative z-10 max-w-2xl">
                <div className="mb-8">
                    <Link href="/pools" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        ← Back to Pools
                    </Link>
                </div>

                <div className="bg-[#131415] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-white/10">
                            <span className="text-4xl">🔐</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white text-center mb-2">
                        Identity Verification
                    </h2>
                    <p className="text-gray-400 text-center mb-8">
                        Verify your identity with Self Protocol to create and manage trusted savings pools.
                    </p>

                    {!account ? (
                        /* Not Connected */
                        <div className="text-center space-y-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-gray-300">
                                Connect your wallet to check your status
                            </p>
                            <div className="flex justify-center">
                                <ConnectButton client={client} chain={celo} theme="dark" />
                            </div>
                        </div>
                    ) : isChecking ? (
                        /* Checking */
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Verifying status...</p>
                        </div>
                    ) : isVerified ? (
                        /* Already Verified */
                        <div className="space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                                <div className="text-4xl mb-3">✅</div>
                                <h3 className="text-xl font-bold text-green-400 mb-1">
                                    Verified Successfully
                                </h3>
                                <p className="text-sm text-gray-400 font-mono">
                                    {account.address}
                                </p>
                            </div>

                            <Link
                                href="/pools/create"
                                className="block w-full bg-white text-black text-center px-6 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-white/10"
                            >
                                Create a Pool
                            </Link>
                        </div>
                    ) : (
                        /* Not Verified */
                        <div className="space-y-6">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-2xl">⚠️</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-yellow-400 mb-1">
                                            Verification Required
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            To ensure the safety of all participants, you must verify your identity before creating a pool. This is a one-time process.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerify}
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                            >
                                {isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Verifying Identity...
                                    </span>
                                ) : (
                                    'Verify Identity Now'
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-500">
                                Powered by Self Protocol • Gas fees apply
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
