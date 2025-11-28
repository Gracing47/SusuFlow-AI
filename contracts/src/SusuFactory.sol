// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SusuPool} from "./SusuPool.sol";
import {SelfVerificationRootMock, ISelfVerificationRoot} from "./interfaces/ISelfVerification.sol";

/**
 * @title SusuFactory
 * @dev Factory contract for creating ROSCA pools with Self Protocol identity verification
 * Inherits from SelfVerificationRoot to enable humanity verification
 */
contract SusuFactory is SelfVerificationRootMock {
    // cUSD token address (Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a)
    address public immutable cUSD;
    
    // All created pools
    address[] public allPools;
    mapping(address => address[]) public userPools;
    mapping(address => bool) public isPool;
    
    // Verification configuration ID (for Self Protocol)
    bytes32 public configId;
    
    // Events
    event PoolCreated(
        address indexed pool,
        address indexed creator,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        uint256 poolIndex
    );
    
    event VerificationConfigUpdated(bytes32 newConfigId);
    
    /**
     * @dev Constructor
     * @param _cUSD Address of cUSD token on Celo
     * @param _hubV2 Address of Self Protocol Hub V2
     * @param _configId Verification configuration ID for Self Protocol
     */
    constructor(
        address _cUSD,
        address _hubV2,
        bytes32 _configId
    ) SelfVerificationRootMock(_hubV2, 12345) { // scopeSeed = 12345
        require(_cUSD != address(0), "Invalid cUSD address");
        cUSD = _cUSD;
        configId = _configId;
    }
    
    /**
     * @dev Create a new ROSCA pool
     * @param _contributionAmount Amount each member contributes per cycle (in cUSD wei)
     * @param _cycleDuration Duration of each cycle in seconds
     * @param _maxMembers Maximum number of members allowed in the pool
     * @return pool Address of the newly created pool
     */
    function createPool(
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers
    ) external onlyVerified returns (address pool) {
        require(_contributionAmount > 0, "Invalid contribution amount");
        require(_cycleDuration >= 1 days, "Cycle too short");
        require(_maxMembers >= 2 && _maxMembers <= 50, "Invalid member count");
        
        // Deploy new SusuPool
        pool = address(
            new SusuPool(
                cUSD,
                _contributionAmount,
                _cycleDuration,
                _maxMembers,
                msg.sender
            )
        );
        
        // Register pool
        allPools.push(pool);
        userPools[msg.sender].push(pool);
        isPool[pool] = true;
        
        emit PoolCreated(
            pool,
            msg.sender,
            _contributionAmount,
            _cycleDuration,
            _maxMembers,
            allPools.length - 1
        );
    }
    
    /**
     * @dev Get verification configuration ID for Self Protocol
     * This is called by SelfVerificationRoot during proof verification
     */
    function getConfigId(
        bytes32, // destinationChainId
        bytes32, // userIdentifier
        bytes memory // userDefinedData
    ) public view override returns (bytes32) {
        return configId;
    }
    
    /**
     * @dev Custom verification hook called after successful Self Protocol verification
     * This is called by SelfVerificationRoot after proof is validated
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory // userData
    ) internal override {
        // Extract user address from userIdentifier
        address user = address(uint160(uint256(output.userIdentifier)));
        
        // Mark user as verified
        if (!isVerified[user]) {
            isVerified[user] = true;
            emit UserVerified(user, output.userIdentifier);
        }
    }
    
    /**
     * @dev Update verification configuration ID (only owner/admin can call)
     * For MVP, anyone can update. In production, add access control.
     */
    function updateConfigId(bytes32 _newConfigId) external {
        configId = _newConfigId;
        emit VerificationConfigUpdated(_newConfigId);
    }
    
    /**
     * @dev Get total number of pools created
     */
    function getTotalPools() external view returns (uint256) {
        return allPools.length;
    }
    
    /**
     * @dev Get pools created by a specific user
     */
    function getUserPools(address user) external view returns (address[] memory) {
        return userPools[user];
    }
    
    /**
     * @dev Get all pools (paginated)
     * @param offset Starting index
     * @param limit Number of pools to return
     */
    function getAllPools(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory pools) 
    {
        require(offset < allPools.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allPools.length) {
            end = allPools.length;
        }
        
        uint256 size = end - offset;
        pools = new address[](size);
        
        for (uint256 i = 0; i < size; i++) {
            pools[i] = allPools[offset + i];
        }
    }
    
    /**
     * @dev Get active pools (pools that are still running)
     * Note: This can be gas-intensive for many pools, use with pagination in production
     */
    function getActivePools() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active pools
        for (uint256 i = 0; i < allPools.length; i++) {
            SusuPool pool = SusuPool(allPools[i]);
            if (pool.poolActive()) {
                activeCount++;
            }
        }
        
        // Create array of active pools
        address[] memory activePools = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            SusuPool pool = SusuPool(allPools[i]);
            if (pool.poolActive()) {
                activePools[index] = allPools[i];
                index++;
            }
        }
        
        return activePools;
    }
}
