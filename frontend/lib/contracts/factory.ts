import { getContract, prepareContractCall, readContract } from 'thirdweb';
import { client, celo, FACTORY_ADDRESS } from '@/lib/client';
import FactoryABI from '@/abis/SusuFactory.json';

// Get the factory contract instance
export const factoryContract = getContract({
    client,
    chain: celo,
    address: FACTORY_ADDRESS,
    abi: FactoryABI.abi,
});

// Read all pools
export async function getAllPools() {
    try {
        const pools = await readContract({
            contract: factoryContract,
            method: 'function getAllPools() view returns (address[])',
            params: [],
        });
        return pools;
    } catch (error) {
        console.error('Error fetching pools:', error);
        return [];
    }
}

// Prepare create pool transaction
// tokenAddress: address(0) for native CELO, or ERC20 address for tokens like cUSD
export function prepareCreatePool(
    tokenAddress: string,
    contributionAmount: bigint,
    cycleDuration: bigint,
    totalMembers: bigint
) {
    return prepareContractCall({
        contract: factoryContract,
        method: 'function createPool(address _token, uint256 _contributionAmount, uint256 _cycleDuration, uint256 _maxMembers) returns (address)',
        params: [tokenAddress, contributionAmount, cycleDuration, totalMembers],
    });
}

// Check if user is verified
export async function isUserVerified(address: string) {
    try {
        const verified = await readContract({
            contract: factoryContract,
            method: 'function isVerified(address user) view returns (bool)',
            params: [address],
        });
        return verified;
    } catch (error) {
        console.error('Error checking verification:', error);
        return false;
    }
}
