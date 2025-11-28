'use client';

import { ConnectButton } from 'thirdweb/react';
import { client, celo } from '@/lib/client';
import { createWallet } from 'thirdweb/wallets';

const wallets = [
    createWallet('io.metamask'),
    createWallet('com.coinbase.wallet'),
    createWallet('me.rainbow'),
];

export function WalletConnect() {
    return (
        <ConnectButton
            client={client}
            chain={celo}
            wallets={wallets}
            connectButton={{
                label: 'Connect Wallet',
            }}
            connectModal={{
                title: 'Connect to SusuFlow',
                size: 'compact',
            }}
        />
    );
}
