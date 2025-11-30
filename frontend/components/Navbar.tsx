'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/lib/client';
import { celo } from 'thirdweb/chains';
import { isUserVerified } from '@/lib/contracts/verification';
import { TalentScore } from './TalentScore';

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
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            SusuFlow
                        </Link>
                    </div>

                    {/* Mobile Connect Button */}
                    <div className="md:hidden">
                        <ConnectButton
                            client={client}
                            chain={celo}
                            theme={"dark"}
                            connectModal={{ size: "compact" }}
                        />
                    </div>

                    {/* Desktop Menu (Hidden on Mobile) */}
                    <div className="hidden md:flex items-center space-x-6">
                        {/* Verification Badge */}
                        {account && (
                            <Link
                                href="/verify"
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-[#1a1b1c] border border-white/10 hover:bg-white/5 ${isCheckingVerification
                                    ? 'text-gray-400'
                                    : isVerified
                                        ? 'text-green-400'
                                        : 'text-yellow-400 animate-pulse'
                                    }`}
                            >
                                {isCheckingVerification ? (
                                    <>⏳ <span className="hidden sm:inline">Checking...</span></>
                                ) : isVerified ? (
                                    <>✅ <span className="hidden sm:inline">Verified</span></>
                                ) : (
                                    <>⚠️ <span className="hidden sm:inline">Verify Now</span></>
                                )}
                            </Link>
                        )}

                        {/* Talent Protocol Score */}
                        {account && <TalentScore address={account.address} />}

                        <Link
                            href="/pools"
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1a1b1c] border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Browse Pools
                        </Link>
                        <Link
                            href="/pools/create"
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1a1b1c] border border-white/10 hover:bg-white/5 transition-all"
                        >
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
        </nav>
    );
}
