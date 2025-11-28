import { createThirdwebClient, defineChain } from 'thirdweb';

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
    throw new Error('Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID');
}

export const client = createThirdwebClient({
    clientId,
});

// Celo Mainnet
export const celo = defineChain({
    id: 42220,
    name: 'Celo',
    nativeCurrency: {
        name: 'CELO',
        symbol: 'CELO',
        decimals: 18,
    },
    rpc: 'https://forno.celo.org',
    blockExplorers: [
        {
            name: 'CeloScan',
            url: 'https://celoscan.io',
        },
    ],
});

// Contract addresses
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
export const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD_ADDRESS!;
export const SELF_HUB = process.env.NEXT_PUBLIC_SELF_HUB!;
