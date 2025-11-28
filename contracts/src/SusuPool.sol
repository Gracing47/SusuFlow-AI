// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./interfaces/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SusuPool
 * @dev Individual ROSCA (Rotating Savings and Credit Association) pool contract
 * Manages contributions, payouts, and member tracking for a savings circle
 */
contract SusuPool is ReentrancyGuard {
    // Pool configuration
    IERC20 public immutable cUSD;
    address public immutable factory;
    uint256 public immutable contributionAmount;
    uint256 public immutable cycleDuration;
    uint256 public immutable maxMembers;
    
    // Pool state
    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => uint256) public contributionsThisCycle;
    mapping(address => bool) public hasReceivedPayout;
    
    uint256 public currentRound;
    uint256 public nextPayoutTime;
    uint256 public poolStartTime;
    address public currentRoundWinner;
    bool public poolActive;
    
    // Events
    event MemberJoined(address indexed member, uint256 memberCount);
    event ContributionMade(address indexed member, uint256 amount, uint256 round);
    event PayoutDistributed(address indexed recipient, uint256 amount, uint256 round);
    event PoolStarted(uint256 startTime, uint256 firstPayoutTime);
    event PoolCompleted(uint256 finalRound);
    
    // Errors
    error OnlyFactory();
    error PoolFull();
    error AlreadyMember();
    error NotMember();
    error PoolNotStarted();
    error PoolNotActive();
    error AlreadyContributed();
    error InvalidAmount();
    error PayoutNotReady();
    error AllMembersNotContributed();
    error NoWinnerSelected();
    
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }
    
    /**
     * @dev Constructor sets up the pool configuration
     */
    constructor(
        address _cUSD,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers,
        address _creator
    ) {
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_contributionAmount > 0, "Invalid contribution amount");
        require(_cycleDuration > 0, "Invalid cycle duration");
        require(_maxMembers >= 2, "Need at least 2 members");
        require(_maxMembers <= 50, "Too many members");
        
        cUSD = IERC20(_cUSD);
        factory = msg.sender;
        contributionAmount = _contributionAmount;
        cycleDuration = _cycleDuration;
        maxMembers = _maxMembers;
        poolActive = true;
        
        // Add creator as first member
        members.push(_creator);
        isMember[_creator] = true;
        
        emit MemberJoined(_creator, 1);
    }
    
    /**
     * @dev Join the pool before it starts
     */
    function joinPool() external {
        if (!poolActive) revert PoolNotActive();
        if (poolStartTime != 0) revert PoolNotStarted(); // Pool already started
        if (members.length >= maxMembers) revert PoolFull();
        if (isMember[msg.sender]) revert AlreadyMember();
        
        members.push(msg.sender);
        isMember[msg.sender] = true;
        
        emit MemberJoined(msg.sender, members.length);
        
        // Auto-start if pool is full
        if (members.length == maxMembers) {
            _startPool();
        }
    }
    
    /**
     * @dev Manually start the pool (called by factory or first member)
     */
    function startPool() external {
        require(msg.sender == factory || msg.sender == members[0], "Not authorized");
        require(poolStartTime == 0, "Already started");
        require(members.length >= 2, "Need at least 2 members");
        
        _startPool();
    }
    
    /**
     * @dev Internal function to start the pool
     */
    function _startPool() private {
        poolStartTime = block.timestamp;
        nextPayoutTime = block.timestamp + cycleDuration;
        currentRound = 1;
        
        emit PoolStarted(poolStartTime, nextPayoutTime);
    }
    
    /**
     * @dev Make a contribution for the current cycle
     */
    function contribute() external nonReentrant {
        if (!poolActive) revert PoolNotActive();
        if (!isMember[msg.sender]) revert NotMember();
        if (poolStartTime == 0) revert PoolNotStarted();
        if (contributionsThisCycle[msg.sender] >= contributionAmount) revert AlreadyContributed();
        
        // Transfer cUSD from member to pool
        bool success = cUSD.transferFrom(msg.sender, address(this), contributionAmount);
        require(success, "Transfer failed");
        
        contributionsThisCycle[msg.sender] = contributionAmount;
        
        emit ContributionMade(msg.sender, contributionAmount, currentRound);
    }
    
    /**
     * @dev Check if all members have contributed for current cycle
     */
    function allMembersContributed() public view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsThisCycle[members[i]] < contributionAmount) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Select the next winner (deterministic, round-robin)
     */
    function selectWinner() public view returns (address) {
        // Find next member who hasn't received payout yet
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasReceivedPayout[members[i]]) {
                return members[i];
            }
        }
        return address(0);
    }
    
    /**
     * @dev Distribute payout to current cycle winner
     * Can be called by anyone (allows NoahAI agent to trigger)
     */
    function distributePot() external nonReentrant {
        if (!poolActive) revert PoolNotActive();
        if (block.timestamp < nextPayoutTime) revert PayoutNotReady();
        if (!allMembersContributed()) revert AllMembersNotContributed();
        
        address winner = selectWinner();
        if (winner == address(0)) revert NoWinnerSelected();
        
        uint256 potAmount = contributionAmount * members.length;
        
        // Mark winner as having received payout
        hasReceivedPayout[winner] = true;
        currentRoundWinner = winner;
        
        // Transfer pot to winner
        bool success = cUSD.transfer(winner, potAmount);
        require(success, "Payout transfer failed");
        
        emit PayoutDistributed(winner, potAmount, currentRound);
        
        // Reset contributions for next cycle
        for (uint256 i = 0; i < members.length; i++) {
            contributionsThisCycle[members[i]] = 0;
        }
        
        // Check if pool is complete
        if (currentRound >= members.length) {
            poolActive = false;
            emit PoolCompleted(currentRound);
        } else {
            // Move to next round
            currentRound++;
            nextPayoutTime = block.timestamp + cycleDuration;
        }
    }
    
    /**
     * @dev Get pool status information
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
        _potBalance = cUSD.balanceOf(address(this));
        _isActive = poolActive;
        _currentWinner = currentRoundWinner;
    }
    
    /**
     * @dev Get member list
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }
    
    /**
     * @dev Get contribution status for a member
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
     * @dev Check who hasn't contributed yet this cycle
     */
    function getMissingContributors() external view returns (address[] memory) {
        uint256 missingCount = 0;
        
        // Count missing contributors
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsThisCycle[members[i]] < contributionAmount) {
                missingCount++;
            }
        }
        
        // Create array of missing contributors
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
}
