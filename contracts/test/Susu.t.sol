// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SusuFactory} from "../src/SusuFactory.sol";
import {SusuPool} from "../src/SusuPool.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

/**
 * @title MockERC20
 * @dev Simple ERC20 mock for testing
 */
contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    
    string public name = "Mock cUSD";
    string public symbol = "cUSD";
    uint8 public decimals = 18;
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
}

/**
 * @title SusuTest
 * @dev Comprehensive test suite for Susu contracts
 */
contract SusuTest is Test {
    SusuFactory public factory;
    MockERC20 public cUSD;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public dave = address(0x4);
    
    address public hubV2 = address(0x999); // Mock Hub V2
    bytes32 public configId = bytes32(uint256(1));
    
    uint256 constant CONTRIBUTION_AMOUNT = 10 ether; // 10 cUSD
    uint256 constant CYCLE_DURATION = 7 days;
    uint256 constant MAX_MEMBERS = 4;
    
    event PoolCreated(
        address indexed pool,
        address indexed creator,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        uint256 poolIndex
    );
    
    function setUp() public {
        // Deploy mock cUSD token
        cUSD = new MockERC20();
        
        // Deploy factory
        factory = new SusuFactory(address(cUSD), hubV2, configId);
        
        // Setup test accounts with cUSD
        cUSD.mint(alice, 1000 ether);
        cUSD.mint(bob, 1000 ether);
        cUSD.mint(charlie, 1000 ether);
        cUSD.mint(dave, 1000 ether);
        
        // Manually verify users for testing
        factory.manualVerify(alice);
        factory.manualVerify(bob);
        factory.manualVerify(charlie);
        factory.manualVerify(dave);
    }
    
    /**
     * Test: Factory deployment
     */
    function testFactoryDeployment() public {
        assertEq(address(factory.cUSD()), address(cUSD));
        assertEq(factory.getTotalPools(), 0);
    }
    
    /**
     * Test: User verification
     */
    function testUserVerification() public {
        assertTrue(factory.isVerified(alice));
        assertTrue(factory.isVerified(bob));
        assertFalse(factory.isVerified(address(0x999)));
    }
    
    /**
     * Test: Create pool with verified user
     */
    function testCreatePool() public {
        vm.prank(alice);
        address pool = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
        
        assertTrue(pool != address(0));
        assertTrue(factory.isPool(pool));
        assertEq(factory.getTotalPools(), 1);
        
        // Check pool configuration
        SusuPool susuPool = SusuPool(pool);
        assertEq(susuPool.contributionAmount(), CONTRIBUTION_AMOUNT);
        assertEq(susuPool.cycleDuration(), CYCLE_DURATION);
        assertEq(susuPool.maxMembers(), MAX_MEMBERS);
        assertTrue(susuPool.poolActive());
    }
    
    /**
     * Test: Unverified user cannot create pool
     */
    function testCannotCreatePoolUnverified() public {
        address unverified = address(0x888);
        
        vm.prank(unverified);
        vm.expectRevert("User not verified");
        factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
    }
    
    /**
     * Test: Join pool
     */
    function testJoinPool() public {
        // Alice creates pool
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
        SusuPool pool = SusuPool(poolAddr);
        
        // Bob joins
        vm.prank(bob);
        pool.joinPool();
        
        assertTrue(pool.isMember(bob));
        address[] memory members = pool.getMembers();
        assertEq(members.length, 2);
        assertEq(members[0], alice);
        assertEq(members[1], bob);
    }
    
    /**
     * Test: Pool auto-starts when full
     */
    function testPoolAutoStart() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(charlie);
        pool.joinPool();
        
        // Pool should auto-start when 4th member joins
        assertEq(pool.poolStartTime(), 0); // Not started yet
        
        vm.prank(dave);
        pool.joinPool();
        
        assertGt(pool.poolStartTime(), 0); // Started!
        assertEq(pool.currentRound(), 1);
    }
    
    /**
     * Test: Make contribution
     */
    function testContribute() public {
        // Create and start pool
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(charlie);
        pool.joinPool();
        
        vm.prank(pool.members(0));
        pool.startPool();
        
        // Alice contributes
        uint256 aliceBalanceBefore = cUSD.balanceOf(alice);
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        
        vm.prank(alice);
        pool.contribute();
        
        uint256 aliceBalanceAfter = cUSD.balanceOf(alice);
        assertEq(aliceBalanceBefore - aliceBalanceAfter, CONTRIBUTION_AMOUNT);
        assertEq(pool.contributionsThisCycle(alice), CONTRIBUTION_AMOUNT);
    }
    
    /**
     * Test: Full cycle - all contribute and payout
     */
    function testFullCycle() public {
        // Create pool with 3 members for faster testing
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(charlie);
        pool.joinPool();
        
        // All members approve spending
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        vm.prank(bob);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        vm.prank(charlie);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        
        // Everyone contributes
        vm.prank(alice);
        pool.contribute();
        vm.prank(bob);
        pool.contribute();
        vm.prank(charlie);
        pool.contribute();
        
        assertTrue(pool.allMembersContributed());
        
        // Warp time to payout
        vm.warp(block.timestamp + CYCLE_DURATION + 1);
        
        // Check who will receive payout (should be alice - first member)
        address winner = pool.selectWinner();
        assertEq(winner, alice);
        
        uint256 aliceBalanceBefore = cUSD.balanceOf(alice);
        
        // Distribute pot
        pool.distributePot();
        
        uint256 aliceBalanceAfter = cUSD.balanceOf(alice);
        uint256 expectedPayout = CONTRIBUTION_AMOUNT * 3;
        
        assertEq(aliceBalanceAfter - aliceBalanceBefore, expectedPayout);
        assertTrue(pool.hasReceivedPayout(alice));
        assertEq(pool.currentRound(), 2);
    }
    
    /**
     * Test: Cannot distribute payout before time
     */
    function testCannotPayoutEarly() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        vm.prank(bob);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        
        vm.prank(alice);
        pool.contribute();
        vm.prank(bob);
        pool.contribute();
        
        // Try to payout before time
        vm.expectRevert(SusuPool.PayoutNotReady.selector);
        pool.distributePot();
    }
    
    /**
     * Test: Cannot payout if not all members contributed
     */
    function testCannotPayoutWithoutAllContributions() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        
        // Only Alice contributes
        vm.prank(alice);
        pool.contribute();
        
        // Warp time
        vm.warp(block.timestamp + CYCLE_DURATION + 1);
        
        // Try to payout
        vm.expectRevert(SusuPool.AllMembersNotContributed.selector);
        pool.distributePot();
    }
    
    /**
     * Test: Get missing contributors
     */
    function testGetMissingContributors() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        vm.prank(charlie);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        
        // Only Alice contributes
        vm.prank(alice);
        pool.contribute();
        
        address[] memory missing = pool.getMissingContributors();
        assertEq(missing.length, 2);
        // Should be Bob and Charlie
        assertTrue(missing[0] == bob || missing[0] == charlie);
        assertTrue(missing[1] == bob || missing[1] == charlie);
    }
    
    /**
     * Test: Multiple pools for same user
     */
    function testMultiplePools() public {
        vm.startPrank(alice);
        address pool1 = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        address pool2 = factory.createPool(CONTRIBUTION_AMOUNT * 2, CYCLE_DURATION * 2, 5);
        vm.stopPrank();
        
        address[] memory alicePools = factory.getUserPools(alice);
        assertEq(alicePools.length, 2);
        assertEq(alicePools[0], pool1);
        assertEq(alicePools[1], pool2);
        assertEq(factory.getTotalPools(), 2);
    }
    
    /**
     * Test: Get active pools
     */
    function testGetActivePools() public {
        // Create 2 pools
        vm.prank(alice);
        address pool1 = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        
        vm.prank(bob);
        address pool2 = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        
        address[] memory activePools = factory.getActivePools();
        assertEq(activePools.length, 2);
    }
    
    /**
     * Test: Pool info getter
     */
    function testGetPoolInfo() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(poolAddr);
        
        vm.prank(bob);
        pool.joinPool();
        
        (
            uint256 memberCount,
            uint256 currentRound,
            uint256 nextPayoutTime,
            uint256 potBalance,
            bool isActive,
            address currentWinner
        ) = pool.getPoolInfo();
        
        assertEq(memberCount, 2);
        assertEq(currentRound, 0); // Not started yet
        assertEq(potBalance, 0);
        assertTrue(isActive);
        assertEq(currentWinner, address(0));
    }
}
