import { getContract, prepareContractCall, readContract } from 'thirdweb';
import { client, celo } from '@/lib/client';

// Self Verification contract address
const SELF_VERIFICATION_ADDRESS = process.env.NEXT_PUBLIC_SELF_VERIFICATION_ADDRESS || '';

if (!SELF_VERIFICATION_ADDRESS) {
    console.warn('⚠️ NEXT_PUBLIC_SELF_VERIFICATION_ADDRESS is not set in .env.local');
    console.warn('Add this line to your .env.local file:');
    console.warn('NEXT_PUBLIC_SELF_VERIFICATION_ADDRESS=0xD0F4F5E2Af5106C4795eff98EEC6B46f8C71096b');
}

// Get the verification contract instance (lazy initialization)
function getSelfVerificationContract() {
    if (!SELF_VERIFICATION_ADDRESS) {
        throw new Error('Self Verification address not configured. Please add NEXT_PUBLIC_SELF_VERIFICATION_ADDRESS to your .env.local file.');
    }

    return getContract({
        client,
        chain: celo,
        address: SELF_VERIFICATION_ADDRESS,
        abi: [
            {
                type: 'function',
                name: 'isVerified',
                inputs: [{ name: 'user', type: 'address' }],
                outputs: [{ type: 'bool' }],
                stateMutability: 'view',
            },
            {
                type: 'function',
                name: 'manualVerify',
                inputs: [{ name: 'user', type: 'address' }],
                outputs: [],
                stateMutability: 'nonpayable',
            },
        ] as any,
    });
}

// Check if user is verified
export async function isUserVerified(address: string): Promise<boolean> {
    if (!SELF_VERIFICATION_ADDRESS) {
        console.warn('Verification contract not configured. Skipping verification check.');
        return false;
    }

    try {
        const contract = getSelfVerificationContract();
        const verified = await readContract({
            contract,
            method: 'function isVerified(address user) view returns (bool)',
            params: [address],
        });
        return verified;
    } catch (error) {
        console.error('Error checking verification:', error);
        return false;
    }
}

// Prepare verification transaction (user verifies themselves)
export function prepareVerifyUser(userAddress: string) {
    const contract = getSelfVerificationContract();
    return prepareContractCall({
        contract,
        method: 'function manualVerify(address user)',
        params: [userAddress],
    });
}
