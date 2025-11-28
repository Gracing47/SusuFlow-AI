import { getContract, prepareContractCall, readContract } from 'thirdweb';
import { client, celo } from '@/lib/client';
import PoolABI from '@/abis/SusuPool.json';

// Get a pool contract instance
export function getPoolContract(poolAddress: string) {
    return getContract({
        client,
        chain: celo,
        address: poolAddress,
        abi: PoolABI.abi,
    });
}

// Read pool info
export async function getPoolInfo(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    try {
        const poolInfo = await readContract({
            contract,
            method: 'function getPoolInfo() view returns (uint256 contributionAmount, uint256 cycleDuration, uint256 currentRound, uint256 nextPayoutTime, bool isActive)',
            params: [],
        });

        const memberCount = await readContract({
            contract,
            method: 'function getMemberCount() view returns (uint256)',
            params: [],
        });

        return {
            contributionAmount: poolInfo[0],
            cycleDuration: poolInfo[1],
            currentRound: poolInfo[2],
            nextPayoutTime: poolInfo[3],
            isActive: poolInfo[4],
            memberCount,
        };
    } catch (error) {
        console.error('Error fetching pool info:', error);
        return null;
    }
}

// Prepare join pool transaction
export function prepareJoinPool(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    return prepareContractCall({
        contract,
        method: 'function joinPool()',
        params: [],
    });
}

// Prepare contribute transaction
export function prepareContribute(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    return prepareContractCall({
        contract,
        method: 'function contribute()',
        params: [],
    });
}

// Check if user has contributed
export async function hasContributed(poolAddress: string, userAddress: string, round: bigint) {
    const contract = getPoolContract(poolAddress);

    try {
        const contributed = await readContract({
            contract,
            method: 'function hasContributed(address member, uint256 round) view returns (bool)',
            params: [userAddress, round],
        });
        return contributed;
    } catch (error) {
        console.error('Error checking contribution:', error);
        return false;
    }
}
