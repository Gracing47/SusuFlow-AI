import React from 'react';

export function Footer() {
    return (
        <footer className="w-full py-6 mt-auto border-t border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-500 font-medium italic">
                    "Grace is not earned but rather a shared gift."
                </p>
                <div className="mt-2 text-xs text-gray-600">
                    Built for Celo Proof of Ship 10 • SusuFlow-AI
                </div>
            </div>
        </footer>
    );
}
