// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SusuPool} from "./SusuPool.sol";
import {ISelfVerification} from "./interfaces/ISelfVerification.sol";

/**
 * @title SusuFactory
 * @dev Factory contract for creating and managing SusuFlow ROSCA pools
 * 
 * This contract serves as the central registry and creator of pool instances.
 * It integrates with Self Protocol for identity verification and maintains
 * a searchable list of all pools.
 * 
 * Key Features:
 * - Self Protocol verification integration
 * - Pool creation with customizable parameters
 * - Support for both native CELO and ERC20 tokens
 * - Pool discovery and filtering
 * 
 * Security:
 * - Only Self-verified users can create pools
 * - All pools are tracked in registry
 * - Emits events for external indexing
 */
contract SusuFactory {
    
    /* ========== STATE VARIABLES ========== */
    
    /// @dev Self Protocol verification contract
    ISelfVerification public immutable selfVerification;
    
    /// @dev Array of all created pool addresses
    address[] public allPools;
    
    /// @dev Mapping from creator to their pools
    mapping(address => address[]) public poolsByCreator;
    
    /// @dev Mapping to check if an address is a valid pool
    mapping(address => bool) public isPool;
    
    /* ========== EVENTS ========== */
    
    /// @dev Emitted when a new pool is created
    event PoolCreated(
        address indexed pool,
        address indexed creator,
        address indexed token,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        bool isNativeToken
    );
    
    /* ========== ERRORS ========== */
    
    error NotVerified();        // User must be Self-verified to create pools
    error InvalidToken();       // Invalid token address provided
    error InvalidParameters();  // Invalid pool configuration parameters
    
    /* ========== MODIFIERS ========== */
    
    /**
     * @dev Ensure caller is Self-verified
     * @notice For MVP, this uses mock verification. In production, integrates with Self Protocol SDK
     */
    modifier onlyVerified() {
        if (!selfVerification.isVerified(msg.sender)) revert NotVerified();
        _;
    }
    
    /* ========== CONSTRUCTOR ========== */
    
    /**
     * @dev Initialize factory with Self Protocol verification
     * @param _selfVerification Address of Self Protocol verification contract
     */
    constructor(address _selfVerification) {
        require(_selfVerification != address(0), "Invalid verification contract");
        selfVerification = ISelfVerification(_selfVerification);
    }
    
    /* ========== POOL CREATION ========== */
    
    /**
     * @dev Create a new SusuPool
     * @param _token Token address (address(0) for native CELO, or ERC20 address like cUSD)
     * @param _contributionAmount Required contribution per cycle (in wei)
     * @param _cycleDuration Duration of each payout cycle (in seconds)
     * @param _maxMembers Maximum number of members (2-50)
     * @return poolAddress Address of the newly created pool
     * 
     * @notice Caller must be Self-verified
     * @notice For native CELO pools, pass address(0) as _token
     * @notice For ERC20 pools (cUSD, etc), pass the token contract address
     * 
     * Example for 1 CELO contributions with 7-day cycles and 5 members:
     *   _token = address(0)
     *   _contributionAmount = 1e18 (1 CELO in wei)
     *   _cycleDuration = 7 * 24 * 60 * 60 (7 days in seconds)
     *   _maxMembers = 5
     * 
     * Example for 10 cUSD contributions:
     *   _token = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 (cUSD Alfajores)
     *   _contributionAmount = 10e18 (10 cUSD in wei)
     *   _cycleDuration = 7 * 24 * 60 * 60
     *   _maxMembers = 5
     */
    function createPool(
        address _token,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers
    ) external onlyVerified returns (address poolAddress) {
        // Validate parameters
        if (_contributionAmount == 0) revert InvalidParameters();
        if (_cycleDuration == 0) revert InvalidParameters();
        if (_maxMembers < 2 || _maxMembers > 50) revert InvalidParameters();
        
        // Deploy new pool instance
        // Note: msg.sender (pool creator) is automatically added as first member
        SusuPool newPool = new SusuPool(
            _token,
            _contributionAmount,
            _cycleDuration,
            _maxMembers,
            msg.sender // Creator becomes first member
        );
        
        poolAddress = address(newPool);
        
        // Register pool in state
        allPools.push(poolAddress);
        poolsByCreator[msg.sender].push(poolAddress);
        isPool[poolAddress] = true;
        
        // Determine if native or ERC20
        bool isNativeToken = (_token == address(0));
        
        // Emit creation event for indexing
        emit PoolCreated(
            poolAddress,
            msg.sender,
            _token,
            _contributionAmount,
            _cycleDuration,
            _maxMembers,
            isNativeToken
        );
    }
    
    /* ========== VIEW FUNCTIONS ========== */
    
    /**
     * @dev Get total number of pools created
     * @return Total pool count
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }
    
    /**
     * @dev Get all pools created by a specific address
     * @param creator Address of the pool creator
     * @return Array of pool addresses created by this user
     */
    function getPoolsByCreator(address creator) external view returns (address[] memory) {
        return poolsByCreator[creator];
    }
    
    /**
     * @dev Get a specific pool by index from global list
     * @param index Position in the allPools array
     * @return Pool address at that index
     */
    function getPoolAtIndex(uint256 index) external view returns (address) {
        require(index < allPools.length, "Index out of bounds");
        return allPools[index];
    }
    
    /**
     * @dev Get a paginated list of pools
     * @param start Starting index
     * @param count Number of pools to return
     * @return Array of pool addresses
     * 
     * @notice Useful for frontend pagination
     * Example: To get pools 10-19, call getPools(10, 10)
     */
    function getPools(uint256 start, uint256 count) external view returns (address[] memory) {
        if (start >= allPools.length) {
            return new address[](0);
        }
        
        // Calculate actual count to return (handle case where start + count > length)
        uint256 end = start + count;
        if (end > allPools.length) {
            end = allPools.length;
        }
        uint256 actualCount = end - start;
        
        // Build result array
        address[] memory pools = new address[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            pools[i] = allPools[start + i];
        }
        
        return pools;
    }
    
    /**
     * @dev Get all pools (use with caution for large lists)
     * @return Array of all pool addresses
     * 
     * @notice For production with many pools, use getPools() for pagination instead
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }
    
    /**
     * @dev Check if an address is a pool created by this factory
     * @param pool Address to check
     * @return True if this is a valid pool from this factory
     */
    function isValidPool(address pool) external view returns (bool) {
        return isPool[pool];
    }
}
