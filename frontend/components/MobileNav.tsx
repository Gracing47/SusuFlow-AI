'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#131415]/90 backdrop-blur-xl border-t border-white/10 pb-6 md:hidden">
            <div className="flex justify-around items-center h-16 px-2">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="text-xl">🏠</span>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/pools"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/pools') ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="text-xl">🌊</span>
                    <span className="text-[10px] font-medium">Pools</span>
                </Link>

                <Link
                    href="/pools/create"
                    className="flex flex-col items-center justify-center w-full h-full -mt-8"
                >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
                        <span className="text-2xl text-white">+</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-300 mt-1">Create</span>
                </Link>

                <Link
                    href="/verify"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/verify') ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="text-xl">🔐</span>
                    <span className="text-[10px] font-medium">Verify</span>
                </Link>
            </div>
        </div>
    );
}
