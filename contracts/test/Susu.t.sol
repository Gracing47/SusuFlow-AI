// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SusuFactory} from "../src/SusuFactory.sol";
import {SusuPool} from "../src/SusuPool.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {ISelfVerification} from "../src/interfaces/ISelfVerification.sol";

/**
 * @title MockERC20
 * @dev Simple ERC20 implementation for testing
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
 * @title MockSelfVerification
 * @dev Mock Self Protocol verification for testing
 */
contract MockSelfVerification is ISelfVerification {
    mapping(address => bool) private verified;
    
    function manualVerify(address user) external {
        verified[user] = true;
    }
    
    function isVerified(address user) external view returns (bool) {
        return verified[user];
    }
}

/**
 * @title SusuTest
 * @dev Comprehensive test suite for Susu contracts
 * Tests both native CELO and ERC20 token (cUSD) pools
 */
contract SusuTest is Test {
    SusuFactory public factory;
    MockERC20 public cUSD;
    MockSelfVerification public selfVerification;
    
    // Test accounts
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public dave = address(0x4);
    
    // Pool configuration constants
    uint256 constant CONTRIBUTION_AMOUNT = 1 ether; // 1 CELO or 1 cUSD
    uint256 constant CYCLE_DURATION = 7 days;
    uint256 constant MAX_MEMBERS = 4;
    
    function setUp() public {
        // Deploy mock cUSD token
        cUSD = new MockERC20();
        
        // Deploy mock Self verification
        selfVerification = new MockSelfVerification();
        
        // Deploy factory
        factory = new SusuFactory(address(selfVerification));
        
        // Setup test accounts with both CELO and cUSD
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(dave, 100 ether);
        
        cUSD.mint(alice, 1000 ether);
        cUSD.mint(bob, 1000 ether);
        cUSD.mint(charlie, 1000 ether);
        cUSD.mint(dave, 1000 ether);
        
        // Manually verify users for testing
        selfVerification.manualVerify(alice);
        selfVerification.manualVerify(bob);
        selfVerification.manualVerify(charlie);
        selfVerification.manualVerify(dave);
    }
    
    /* ========== FACTORY TESTS ========== */
    
    /// @dev Test factory deployment
    function testFactoryDeployment() public {
        assertEq(factory.getPoolCount(), 0);
    }
    
    /// @dev Test user verification
    function testUserVerification() public {
        assertTrue(selfVerification.isVerified(alice));
        assertTrue(selfVerification.isVerified(bob));
        assertFalse(selfVerification.isVerified(address(0x999)));
    }
    
    /// @dev Test unverified user cannot create pool
    function testCannotCreatePoolUnverified() public {
        address unverified = address(0x888);
        
        vm.prank(unverified);
        vm.expectRevert();
        factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, MAX_MEMBERS);
    }
    
    /* ========== NATIVE CELO POOL TESTS ========== */
    
    /// @dev Test creating a native CELO pool
    function testCreateNativePool() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(
            address(0), // address(0) for native CELO
            CONTRIBUTION_AMOUNT,
            CYCLE_DURATION,
            MAX_MEMBERS
        );
        
        SusuPool pool = SusuPool(payable(poolAddr));
        assertTrue(pool.isNativeToken());
        assertEq(pool.contributionAmount(), CONTRIBUTION_AMOUNT);
    }
    
    /// @dev Test full cycle with native CELO
    function testNativePoolFullCycle() public {
        // Create native CELO pool
        vm.prank(alice);
        address poolAddr = factory.createPool(address(0), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        // Bob joins
        vm.prank(bob);
        pool.joinPool();
        
        assertTrue(pool.poolStartTime() > 0); // Auto-started
        
        // Both contribute with CELO
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        pool.contribute{value: CONTRIBUTION_AMOUNT}();
        assertEq(alice.balance, aliceBalanceBefore - CONTRIBUTION_AMOUNT);
        
        vm.prank(bob);
        pool.contribute{value: CONTRIBUTION_AMOUNT}();
        
        assertTrue(pool.allMembersContributed());
        
        // Warp time and distribute
        vm.warp(block.timestamp + CYCLE_DURATION + 1);
        
        uint256 aliceBalanceBeforePayout = alice.balance;
        pool.distributePot();
        
        // Alice should receive 2 * CONTRIBUTION_AMOUNT
        uint256 expectedPayout = CONTRIBUTION_AMOUNT * 2;
        assertEq(alice.balance, aliceBalanceBeforePayout + expectedPayout);
    }
    
    /// @dev Test cannot send wrong amount for native pool
    function testNativePoolWrongAmount() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(0), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        vm.expectRevert(SusuPool.InvalidAmount.selector);
        pool.contribute{value: CONTRIBUTION_AMOUNT + 1 wei}(); // Wrong amount
    }
    
    /* ========== ERC20 (cUSD) POOL TESTS ========== */
    
    /// @dev Test creating an ERC20 pool
    function testCreateERC20Pool() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(
            address(cUSD),
            CONTRIBUTION_AMOUNT,
            CYCLE_DURATION,
            MAX_MEMBERS
        );
        
        SusuPool pool = SusuPool(payable(poolAddr));
        assertFalse(pool.isNativeToken());
        assertEq(address(pool.token()), address(cUSD));
    }
    
    /// @dev Test full cycle with ERC20 token
    function testERC20PoolFullCycle() public {
        // Create cUSD pool
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        // Bob joins
        vm.prank(bob);
        pool.joinPool();
        
        // Approve spending
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        vm.prank(bob);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT * 10);
        
        // Both contribute
        uint256 aliceBalanceBefore = cUSD.balanceOf(alice);
        vm.prank(alice);
        pool.contribute();
        assertEq(cUSD.balanceOf(alice), aliceBalanceBefore - CONTRIBUTION_AMOUNT);
        
        vm.prank(bob);
        pool.contribute();
        
        assertTrue(pool.allMembersContributed());
        
        // Warp time and distribute
        vm.warp(block.timestamp + CYCLE_DURATION + 1);
        
        uint256 aliceBalanceBeforePayout = cUSD.balanceOf(alice);
        pool.distributePot();
        
        // Alice should receive 2 * CONTRIBUTION_AMOUNT
        uint256 expectedPayout = CONTRIBUTION_AMOUNT * 2;
        assertEq(cUSD.balanceOf(alice), aliceBalanceBeforePayout + expectedPayout);
    }
    
    /// @dev Test cannot send CELO to ERC20 pool
    function testERC20PoolNoNativeCELO() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        
        vm.prank(alice);
        vm.expectRevert(SusuPool.InvalidAmount.selector);
        pool.contribute{value: 1 ether}(); // Sending CELO to ERC20 pool
    }
    
    /* ========== COMMON POOL TESTS ========== */
    
    /// @dev Test pool auto-start when full
    function testPoolAutoStart() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        assertEq(pool.poolStartTime(), 0);
        
        vm.prank(bob);
        pool.joinPool();
        
        assertEq(pool.poolStartTime(), 0); // Still not started
        
        vm.prank(charlie);
        pool.joinPool(); // Pool is now full
        
        assertGt(pool.poolStartTime(), 0); // Auto-started!
    }
    
    /// @dev Test cannot join full pool (pool auto-starts and then rejects new members)
    function testCannotJoinFullPool() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool(); // Pool now full and auto-started
        
        vm.prank(charlie);
        vm.expectRevert(SusuPool.PoolNotStarted.selector); // Pool already started
        pool.joinPool();
    }
    
    /// @dev Test cannot distribute before time
    function testCannotPayoutEarly() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        vm.prank(alice);
        pool.contribute();
        
        vm.prank(bob);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        vm.prank(bob);
        pool.contribute();
        
        vm.expectRevert(SusuPool.PayoutNotReady.selector);
        pool.distributePot();
    }
    
    /// @dev Test cannot payout without all contributions
    function testCannotPayoutWithoutAllContributions() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        vm.prank(alice);
        pool.contribute();
        
        // Bob doesn't contribute
        
        vm.warp(block.timestamp + CYCLE_DURATION + 1);
        
        vm.expectRevert(SusuPool.AllMembersNotContributed.selector);
        pool.distributePot();
    }
    
    /// @dev Test getMissingContributors
    function testGetMissingContributors() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(payable(poolAddr));
        
        vm.prank(bob);
        pool.joinPool();
        vm.prank(charlie);
        pool.joinPool();
        
        vm.prank(alice);
        cUSD.approve(poolAddr, CONTRIBUTION_AMOUNT);
        vm.prank(alice);
        pool.contribute();
        
        address[] memory missing = pool.getMissingContributors();
        assertEq(missing.length, 2);
    }
    
    /// @dev Test getPoolInfo
    function testGetPoolInfo() public {
        vm.prank(alice);
        address poolAddr = factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 3);
        SusuPool pool = SusuPool(payable(poolAddr));
        
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
    
    /// @dev Test factory getPools pagination
    function testFactoryPagination() public {
        // Create 5 pools
        for (uint i = 0; i < 5; i++) {
            vm.prank(alice);
            factory.createPool(address(cUSD), CONTRIBUTION_AMOUNT, CYCLE_DURATION, 2);
        }
        
        assertEq(factory.getPoolCount(), 5);
        
        // Get first 3 pools
        address[] memory pools = factory.getPools(0, 3);
        assertEq(pools.length, 3);
        
        // Get next 2 pools
        address[] memory pools2 = factory.getPools(3, 2);
        assertEq(pools2.length, 2);
    }
}
