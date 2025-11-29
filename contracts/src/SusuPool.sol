// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./interfaces/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SusuPool
 * @dev Individual ROSCA (Rotating Savings and Credit Association) pool contract
 * 
 * This contract manages a savings circle where members contribute regularly and take turns
 * receiving the accumulated pot. It supports both native CELO and ERC20 tokens (like cUSD).
 * 
 * Key Features:
 * - Dual token support (native CELO or ERC20)
 * - Round-robin payout distribution
 * - Automated cycle management
 * - Member contribution tracking
 * 
 * Lifecycle:
 * 1. Pool Created → Members Join
 * 2. Pool Starts (manual or auto when full)
 * 3. Members Contribute → Pot Distributed
 * 4. Cycle Repeats until all members receive payout
 */
contract SusuPool is ReentrancyGuard {
    
    /* ========== IMMUTABLE CONFIGURATION ========== */
    
    /// @dev The token used for contributions (address(0) for native CELO)
    IERC20 public immutable token;
    
    /// @dev Factory contract that created this pool
    address public immutable factory;
    
    /// @dev Required contribution amount per cycle (in wei)
    uint256 public immutable contributionAmount;
    
    /// @dev Duration of each cycle in seconds
    uint256 public immutable cycleDuration;
    
    /// @dev Maximum number of members allowed
    uint256 public immutable maxMembers;
    
    /// @dev True if pool uses native CELO, false if using ERC20
    bool public immutable isNativeToken;
    
    /* ========== POOL STATE ========== */
    
    /// @dev Array of all member addresses
    address[] public members;
    
    /// @dev Mapping to check if an address is a member
    mapping(address => bool) public isMember;
    
    /// @dev Track how much each member has contributed this cycle
    mapping(address => uint256) public contributionsThisCycle;
    
    /// @dev Track which members have already received their payout
    mapping(address => bool) public hasReceivedPayout;
    
    /// @dev Current round number (starts at 1)
    uint256 public currentRound;
    
    /// @dev Timestamp when the next payout can be distributed
    uint256 public nextPayoutTime;
    
    /// @dev Timestamp when the pool started (0 if not started)
    uint256 public poolStartTime;
    
    /// @dev Address of the winner for the current round
    address public currentRoundWinner;
    
    /// @dev Whether the pool is still active (false after all rounds complete)
    bool public poolActive;
    
    /* ========== EVENTS ========== */
    
    /// @dev Emitted when a new member joins the pool
    event MemberJoined(address indexed member, uint256 memberCount);
    
    /// @dev Emitted when a member makes a contribution
    event ContributionMade(address indexed member, uint256 amount, uint256 round);
    
    /// @dev Emitted when the pot is distributed to a winner
    event PayoutDistributed(address indexed recipient, uint256 amount, uint256 round);
    
    /// @dev Emitted when the pool starts
    event PoolStarted(uint256 startTime, uint256 firstPayoutTime);
    
    /// @dev Emitted when all rounds are complete
    event PoolCompleted(uint256 finalRound);
    
    /* ========== ERRORS ========== */
    
    error OnlyFactory();                    // Only factory can call this function
    error PoolFull();                       // Pool has reached max members
    error AlreadyMember();                  // Address is already a member
    error NotMember();                      // Address is not a member
    error PoolNotStarted();                 // Pool hasn't started yet OR already started (context dependent)
    error PoolNotActive();                  // Pool is no longer active
    error AlreadyContributed();             // Member already contributed this cycle
    error InvalidAmount();                  // Incorrect contribution amount
    error PayoutNotReady();                 // Not enough time has passed for payout
    error AllMembersNotContributed();       // Not all members have contributed
    error NoWinnerSelected();               // No eligible winner found
    error TransferFailed();                 // Token/CELO transfer failed
    
    /* ========== MODIFIERS ========== */
    
    /// @dev Restrict function to factory contract only
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }
    
    /* ========== CONSTRUCTOR ========== */
    
    /**
     * @dev Initialize a new SusuPool
     * @param _token Token address (address(0) for native CELO, or ERC20 address for tokens like cUSD)
     * @param _contributionAmount Required contribution per cycle in wei
     * @param _cycleDuration Duration of each cycle in seconds
     * @param _maxMembers Maximum number of members allowed (2-50)
     * @param _creator Address of the pool creator (becomes first member)
     */
    constructor(
        address _token,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers,
        address _creator
    ) {
        // Validate inputs
        require(_contributionAmount > 0, "Invalid contribution amount");
        require(_cycleDuration > 0, "Invalid cycle duration");
        require(_maxMembers >= 2, "Need at least 2 members");
        require(_maxMembers <= 50, "Too many members");
        
        // Set immutable variables
        token = IERC20(_token);
        factory = msg.sender;
        contributionAmount = _contributionAmount;
        cycleDuration = _cycleDuration;
        maxMembers = _maxMembers;
        isNativeToken = (_token == address(0));
        poolActive = true;
        
        // Add creator as first member
        members.push(_creator);
        isMember[_creator] = true;
        
        emit MemberJoined(_creator, 1);
    }
    
    /* ========== MEMBER MANAGEMENT ========== */
    
    /**
     * @dev Join the pool before it starts
     * @notice Pool must not have started and must not be full
     */
    function joinPool() external {
        // Validate pool state
        if (!poolActive) revert PoolNotActive();
        if (poolStartTime != 0) revert PoolNotStarted(); // "Pool already started" context
        if (members.length >= maxMembers) revert PoolFull();
        if (isMember[msg.sender]) revert AlreadyMember();
        
        // Add member
        members.push(msg.sender);
        isMember[msg.sender] = true;
        
        emit MemberJoined(msg.sender, members.length);
        
        // Auto-start pool when full
        if (members.length == maxMembers) {
            _startPool();
        }
    }
    
    /**
     * @dev Manually start the pool
     * @notice Can be called by factory or first member once minimum members joined
     */
    function startPool() external {
        require(msg.sender == factory || msg.sender == members[0], "Not authorized");
        require(poolStartTime == 0, "Already started");
        require(members.length >= 2, "Need at least 2 members");
        
        _startPool();
    }
    
    /**
     * @dev Internal function to initialize pool rounds
     */
    function _startPool() private {
        poolStartTime = block.timestamp;
        nextPayoutTime = block.timestamp + cycleDuration;
        currentRound = 1;
        
        emit PoolStarted(poolStartTime, nextPayoutTime);
    }
    
    /* ========== CONTRIBUTION FUNCTIONS ========== */
    
    /**
     * @dev Make a contribution for the current cycle
     * @notice For native CELO: send exact amount as msg.value
     *         For ERC20: must approve this contract first, then call with 0 msg.value
     */
    function contribute() external payable nonReentrant {
        // Validate state
        if (!poolActive) revert PoolNotActive();
        if (!isMember[msg.sender]) revert NotMember();
        if (poolStartTime == 0) revert PoolNotStarted();
        if (contributionsThisCycle[msg.sender] >= contributionAmount) revert AlreadyContributed();
        
        if (isNativeToken) {
            // Native CELO contribution
            // User must send exact contribution amount as msg.value
            if (msg.value != contributionAmount) revert InvalidAmount();
            
        } else {
            // ERC20 contribution (e.g., cUSD)
            // User must have approved this contract to spend tokens
            if (msg.value != 0) revert InvalidAmount(); // No CELO should be sent for ERC20 pools
            
            bool success = token.transferFrom(msg.sender, address(this), contributionAmount);
            if (!success) revert TransferFailed();
        }
        
        // Record contribution
        contributionsThisCycle[msg.sender] = contributionAmount;
        
        emit ContributionMade(msg.sender, contributionAmount, currentRound);
    }
    
    /**
     * @dev Check if all members have contributed for the current cycle
     * @return True if all members have fully contributed
     */
    function allMembersContributed() public view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsThisCycle[members[i]] < contributionAmount) {
                return false;
            }
        }
        return true;
    }
    
    /* ========== PAYOUT DISTRIBUTION ========== */
    
    /**
     * @dev Select the next winner using round-robin (deterministic)
     * @return Address of the next member who hasn't received a payout yet
     */
    function selectWinner() public view returns (address) {
        // Find first member who hasn't received payout
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasReceivedPayout[members[i]]) {
                return members[i];
            }
        }
        // No winner found (all members have received payouts)
        return address(0);
    }
    
    /**
     * @dev Distribute the accumulated pot to the current cycle's winner
     * @notice Can be called by anyone (enables NoahAI agent automation)
     *         Requires: time reached, all members contributed, winner available
     */
    function distributePot() external nonReentrant {
        // Validate payout conditions
        if (!poolActive) revert PoolNotActive();
        if (block.timestamp < nextPayoutTime) revert PayoutNotReady();
        if (!allMembersContributed()) revert AllMembersNotContributed();
        
        // Select winner
        address winner = selectWinner();
        if (winner == address(0)) revert NoWinnerSelected();
        
        // Calculate pot amount (total contributions from all members)
        uint256 potAmount = contributionAmount * members.length;
        
        // Mark winner as having received payout
        hasReceivedPayout[winner] = true;
        currentRoundWinner = winner;
        
        // Transfer pot to winner
        if (isNativeToken) {
            // Native CELO transfer
            (bool success, ) = winner.call{value: potAmount}("");
            if (!success) revert TransferFailed();
        } else {
            // ERC20 transfer
            bool success = token.transfer(winner, potAmount);
            if (!success) revert TransferFailed();
        }
        
        emit PayoutDistributed(winner, potAmount, currentRound);
        
        // Reset contributions for next cycle
        for (uint256 i = 0; i < members.length; i++) {
            contributionsThisCycle[members[i]] = 0;
        }
        
        // Check if pool is complete (all members received payout)
        if (currentRound >= members.length) {
            poolActive = false;
            emit PoolCompleted(currentRound);
        } else {
            // Advance to next round
            currentRound++;
            nextPayoutTime = block.timestamp + cycleDuration;
        }
    }
    
    /* ========== VIEW FUNCTIONS ========== */
    
    /**
     * @dev Get comprehensive pool status information
     * @return _memberCount Number of members in the pool
     * @return _currentRound Current round number
     * @return _nextPayoutTime Timestamp for next payout eligibility
     * @return _potBalance Current token/CELO balance in contract
     * @return _isActive Whether pool is still active
     * @return _currentWinner Address of current round winner (if distributed)
     */
    function getPoolInfo() external view returns (
        uint256 _memberCount,
        uint256 _currentRound,
        uint256 _nextPayoutTime,
        uint256 _potBalance,
        bool _isActive,
        address _currentWinner
    ) {
        _memberCount = members.length;
        _currentRound = currentRound;
        _nextPayoutTime = nextPayoutTime;
        
        // Get balance based on token type
        if (isNativeToken) {
            _potBalance = address(this).balance;
        } else {
            _potBalance = token.balanceOf(address(this));
        }
        
        _isActive = poolActive;
        _currentWinner = currentRoundWinner;
    }
    
    /**
     * @dev Get list of all pool members
     * @return Array of member addresses
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }
    
    /**
     * @dev Get detailed status for a specific member
     * @param member Address to check
     * @return _isMember Whether address is a pool member
     * @return _contributedThisCycle Amount contributed in current cycle
     * @return _hasReceivedPayout Whether member has received their payout
     */
    function getMemberStatus(address member) external view returns (
        bool _isMember,
        uint256 _contributedThisCycle,
        bool _hasReceivedPayout
    ) {
        _isMember = isMember[member];
        _contributedThisCycle = contributionsThisCycle[member];
        _hasReceivedPayout = hasReceivedPayout[member];
    }
    
    /**
     * @dev Get list of members who haven't contributed this cycle
     * @return Array of addresses that haven't met contribution requirement
     */
    function getMissingContributors() external view returns (address[] memory) {
        // Count missing contributors
        uint256 missingCount = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsThisCycle[members[i]] < contributionAmount) {
                missingCount++;
            }
        }
        
        // Build array of missing contributors
        address[] memory missing = new address[](missingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsThisCycle[members[i]] < contributionAmount) {
                missing[index] = members[i];
                index++;
            }
        }
        
        return missing;
    }
    
    /* ========== RECEIVE FUNCTION ========== */
    
    /**
     * @dev Allow contract to receive native CELO
     * @notice Only accepts CELO if pool is configured for native token
     */
    receive() external payable {
        require(isNativeToken, "Pool does not accept native CELO");
    }
}
