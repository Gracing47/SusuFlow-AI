'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/lib/client';
import { celo } from 'thirdweb/chains';
import { isUserVerified } from '@/lib/contracts/verification';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);
    const account = useActiveAccount();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        async function checkVerification() {
            if (!account) {
                setIsVerified(false);
                return;
            }

            setIsCheckingVerification(true);
            const verified = await isUserVerified(account.address);
            setIsVerified(verified);
            setIsCheckingVerification(false);
        }

        checkVerification();
    }, [account]);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isOpen
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent border-b border-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            SusuFlow
                        </Link>
                    </div>

                    {/* Burger Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none p-2"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Desktop Menu (Hidden on Mobile) */}
                    <div className="hidden md:flex items-center space-x-6">
                        {/* Verification Badge */}
                        {account && (
                            <Link
                                href="/verify"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isCheckingVerification
                                        ? 'bg-gray-500/20 text-gray-400'
                                        : isVerified
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 animate-pulse'
                                    }`}
                            >
                                {isCheckingVerification ? '⏳ Checking...' : isVerified ? '✅ Verified' : '⚠️ Verify Now'}
                            </Link>
                        )}

                        <Link href="/pools/create" className="text-gray-300 hover:text-white transition-colors">
                            Create Pool
                        </Link>
                        <ConnectButton
                            client={client}
                            chain={celo}
                            theme={"dark"}
                            connectModal={{ size: "compact" }}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 pt-2 pb-6 space-y-4">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Home
                        </Link>

                        {/* Verification Status (Mobile) */}
                        {account && (
                            <Link
                                href="/verify"
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${isCheckingVerification
                                        ? 'bg-gray-500/20 text-gray-400'
                                        : isVerified
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400 animate-pulse'
                                    }`}
                            >
                                {isCheckingVerification ? '⏳ Checking Verification...' : isVerified ? '✅ Verified' : '⚠️ Verify Your Identity'}
                            </Link>
                        )}

                        <Link
                            href="/pools/create"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Create Pool
                        </Link>

                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between px-3">
                                <span className="text-sm text-gray-400">Wallet</span>
                                <ConnectButton
                                    client={client}
                                    chain={celo}
                                    theme={"dark"}
                                    connectModal={{ size: "compact" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
