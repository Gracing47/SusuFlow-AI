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
                    <ConnectButton client={client} chain={celo} />
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 max-w-2xl">
                <div className="mb-8">
                    <Link href="/pools" className="text-purple-400 hover:text-purple-300">
                        ← Back to Pools
                    </Link>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-5xl">🔐</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        Self Protocol Verification
                    </h2>

                    {!account ? (
                        /* Not Connected */
                        <div className="text-center space-y-6">
                            <p className="text-gray-300 text-lg">
                                Connect your wallet to verify your identity
                            </p>
                            <div className="flex justify-center">
                                <ConnectButton client={client} chain={celo} />
                            </div>
                        </div>
                    ) : isChecking ? (
                        /* Checking */
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                            </div>
                            <p className="text-gray-300">Checking verification status...</p>
                        </div>
                    ) : isVerified ? (
                        /* Already Verified */
                        <div className="text-center space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-green-400 mb-2">
                                    Already Verified!
                                </h3>
                                <p className="text-gray-300">
                                    Your address <span className="font-mono text-sm">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span> is verified.
                                </p>
                            </div>

                            <Link
                                href="/pools/create"
                                className="inline-block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform text-center"
                            >
                                Create a Pool →
                            </Link>
                        </div>
                    ) : (
                        /* Not Verified */
                        <div className="space-y-6">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                                <div className="text-6xl mb-4 text-center">⚠️</div>
                                <h3 className="text-xl font-bold text-yellow-400 mb-2 text-center">
                                    Verification Required
                                </h3>
                                <p className="text-gray-300 text-center mb-4">
                                    To create pools, you need to verify your identity through Self Protocol.
                                </p>
                                <div className="text-sm text-gray-400 space-y-2">
                                    <p>✓ One-time verification</p>
                                    <p>✓ Free transaction (just gas fees)</p>
                                    <p>✓ Instant approval for MVP</p>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <span>ℹ️</span>
                                    About Self Protocol
                                </h4>
                                <p className="text-gray-300 text-sm">
                                    Self Protocol provides decentralized identity verification. For this MVP,
                                    we're using a simplified mock contract that allows instant self-verification.
                                    In production, this would integrate with the full Self Protocol verification flow.
                                </p>
                            </div>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerify}
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Verifying...
                                    </span>
                                ) : (
                                    '🔐 Verify My Address'
                                )}
                            </button>

                            {/* Address Display */}
                            <p className="text-center text-gray-400 text-sm">
                                Verifying: <span className="font-mono text-white">{account.address}</span>
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
