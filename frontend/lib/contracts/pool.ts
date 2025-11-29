import { getContract, prepareContractCall, readContract } from 'thirdweb';
import { client, celo } from '@/lib/client';
import PoolABI from '@/abis/SusuPool.json';

// Get a pool contract instance
export function getPoolContract(poolAddress: string) {
    return getContract({
        client,
        chain: celo,
        address: poolAddress,
        abi: PoolABI.abi as any,
    });
}

// Read pool info
export async function getPoolInfo(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    try {
        // Fetch immutable config
        const contributionAmount = await readContract({
            contract,
            method: 'function contributionAmount() view returns (uint256)',
            params: [],
        });

        const cycleDuration = await readContract({
            contract,
            method: 'function cycleDuration() view returns (uint256)',
            params: [],
        });

        const maxMembers = await readContract({
            contract,
            method: 'function maxMembers() view returns (uint256)',
            params: [],
        });

        // Fetch dynamic state
        // Returns: (_memberCount, _currentRound, _nextPayoutTime, _potBalance, _isActive, _currentWinner)
        const poolState = await readContract({
            contract,
            method: 'function getPoolInfo() view returns (uint256, uint256, uint256, uint256, bool, address)',
            params: [],
        });

        return {
            contributionAmount,
            cycleDuration,
            maxMembers,
            memberCount: poolState[0],
            currentRound: poolState[1],
            nextPayoutTime: poolState[2],
            potBalance: poolState[3],
            isActive: poolState[4],
            currentWinner: poolState[5],
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

// Check if pool uses native token and get token address
// For backward compatibility with old pools, defaults to cUSD if functions don't exist
export async function getPoolTokenInfo(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    try {
        const isNativeToken = await readContract({
            contract,
            method: 'function isNativeToken() view returns (bool)',
            params: [],
        });

        const tokenAddress = await readContract({
            contract,
            method: 'function token() view returns (address)',
            params: [],
        });

        return {
            isNativeToken,
            tokenAddress,
        };
    } catch (error) {
        console.warn('Pool does not support dual-token interface (old contract). Defaulting to cUSD.');
        // Fallback for old pools: assume cUSD on mainnet
        return {
            isNativeToken: false,
            tokenAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a' // cUSD Mainnet
        };
    }
}

// Prepare contribute transaction
// For native CELO: pass value parameter
// For ERC20: no value needed
export function prepareContribute(poolAddress: string, value?: bigint) {
    const contract = getPoolContract(poolAddress);

    return prepareContractCall({
        contract,
        method: 'function contribute() payable',
        params: [],
        value: value, // Only used for native CELO
    });
}

// Check if user has contributed
// Check if user has contributed
export async function hasContributed(poolAddress: string, userAddress: string, round: bigint) {
    const contract = getPoolContract(poolAddress);

    try {
        // Note: The contract doesn't have a simple hasContributed(user, round) function.
        // It has contributionsThisCycle mapping.
        // We should use getMemberStatus instead or check contributionsThisCycle.
        // But for now, let's use the getMemberStatus if we want detailed info.

        // Let's implement getMemberStatus instead as it's more robust
        const status = await readContract({
            contract,
            method: 'function getMemberStatus(address member) view returns (bool, uint256, bool)',
            params: [userAddress],
        });

        // status[1] is _contributedThisCycle
        return status[1] > BigInt(0);
    } catch (error) {
        console.error('Error checking contribution:', error);
        return false;
    }
}

// Get all pool members
export async function getPoolMembers(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    try {
        const members = await readContract({
            contract,
            method: 'function getMembers() view returns (address[])',
            params: [],
        });
        return members;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}
// Prepare distribute pot transaction
export function prepareDistributePot(poolAddress: string) {
    const contract = getPoolContract(poolAddress);

    return prepareContractCall({
        contract,
        method: 'function distributePot()',
        params: [],
    });
}
// Get all pool members with their contribution status
export async function getPoolMembersWithStatus(poolAddress: string, round: bigint, contributionAmount: bigint) {
    const contract = getPoolContract(poolAddress);

    try {
        const members = await readContract({
            contract,
            method: 'function getMembers() view returns (address[])',
            params: [],
        });

        const membersWithStatus = await Promise.all(members.map(async (member) => {
            try {
                const status = await readContract({
                    contract,
                    method: 'function getMemberStatus(address member) view returns (bool, uint256, bool)',
                    params: [member],
                });
                // status[1] is _contributedThisCycle
                return {
                    address: member,
                    hasContributed: status[1] >= contributionAmount
                };
            } catch (e) {
                console.error(`Error fetching status for ${member}`, e);
                return { address: member, hasContributed: false };
            }
        }));

        return membersWithStatus;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}
