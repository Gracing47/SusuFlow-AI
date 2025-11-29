// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SusuFactory} from "../src/SusuFactory.sol";
import {ISelfVerification} from "../src/interfaces/ISelfVerification.sol";

/**
 * @title MockSelfVerificationForDeployment
 * @dev Mock Self Protocol verification for testnet deployment
 * In production, replace this with actual Self Protocol integration
 */
contract MockSelfVerificationForDeployment is ISelfVerification {
    mapping(address => bool) private verified;
    
    constructor() {}
    
    // Allow anyone to verify any address for the demo
    function manualVerify(address user) external {
        verified[user] = true;
    }
    
    function isVerified(address user) external view returns (bool) {
        return verified[user];
    }
}

/**
 * @title DeployScript
 * @dev Deployment script for SusuFlow contracts
 * 
 * Usage:
 *   Alfajores (testnet):
 *     forge script script/Deploy.s.sol:DeployScript --rpc-url $ALFAJORES_RPC --broadcast --verify -vvvv
 *   
 *   Celo Mainnet:
 *     forge script script/Deploy.s.sol:DeployScript --rpc-url $CELO_RPC --broadcast --verify -vvvv
 * 
 * Environment Variables Required:
 *   - PRIVATE_KEY: Deployer's private key
 *   - ALFAJORES_RPC or CELO_RPC: RPC endpoint
 *   - CELOSCAN_API_KEY: For contract verification
 */
contract DeployScript is Script {
    
    // Deployed contract instances
    MockSelfVerificationForDeployment public selfVerification;
    SusuFactory public factory;
    
    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("====================================");
        console.log("SusuFlow Deployment Script");
        console.log("====================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Mock Self Protocol Verification
        console.log("Deploying Mock Self Verification...");
        selfVerification = new MockSelfVerificationForDeployment();
        console.log("Mock Self Verification deployed at:", address(selfVerification));
        console.log("");
        
        // 2. Deploy Factory
        console.log("Deploying SusuFactory...");
        factory = new SusuFactory(address(selfVerification));
        console.log("SusuFactory deployed at:", address(factory));
        console.log("");
        
        // 3. Verify deployer for testing
        console.log("Verifying deployer address for testing...");
        selfVerification.manualVerify(deployer);
        console.log("");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("====================================");
        console.log("Deployment Summary");
        console.log("====================================");
        console.log("Self Verification:", address(selfVerification));
        console.log("SusuFactory:", address(factory));
        console.log("");
        console.log("Next Steps:");
        console.log("1. Save these addresses to your .env file:");
        console.log("   SELF_VERIFICATION_ADDRESS=%s", address(selfVerification));
        console.log("   FACTORY_ADDRESS=%s", address(factory));
        console.log("");
        console.log("2. Update frontend configuration with factory address");
        console.log("");
        console.log("3. To create a pool:");
        console.log("   - For native CELO: call createPool(address(0), amount, duration, maxMembers)");
        console.log("   - For cUSD: call createPool(0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1, amount, duration, maxMembers)");
        console.log("");
        console.log("4. Verify deployer is authorized (already done): true");
        console.log("====================================");
    }
}
