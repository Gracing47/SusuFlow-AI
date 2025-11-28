// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SusuFactory} from "../src/SusuFactory.sol";
import {SusuPool} from "../src/SusuPool.sol";

/**
 * @title DeployScript
 * @dev Deployment script for SusuFlow contracts
 * 
 * Usage:
 * 1. For Alfajores (Testnet):
 *    forge script script/Deploy.s.sol:DeployScript --rpc-url celo_alfajores --broadcast --verify
 * 
 * 2. For Mainnet:
 *    forge script script/Deploy.s.sol:DeployScript --rpc-url celo_mainnet --broadcast --verify
 */
contract DeployScript is Script {
    // Celo cUSD addresses
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    // Self Protocol Hub V2 addresses
    address constant SELF_HUB_MAINNET = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;
    address constant SELF_HUB_ALFAJORES = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF; // Replace with actual if different
    
    // Default verification config ID (placeholder)
    bytes32 constant DEFAULT_CONFIG_ID = bytes32(uint256(1));
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Determine which network we're on
        uint256 chainId = block.chainid;
        address cUSDAddress;
        address hubV2Address;
        
        if (chainId == 42220) {
            // Celo Mainnet
            console.log("Deploying to Celo Mainnet");
            cUSDAddress = CUSD_MAINNET;
            hubV2Address = SELF_HUB_MAINNET;
        } else if (chainId == 44787) {
            // Alfajores Testnet
            console.log("Deploying to Celo Alfajores Testnet");
            cUSDAddress = CUSD_ALFAJORES;
            hubV2Address = SELF_HUB_ALFAJORES;
        } else {
            // Unknown network - use default
            console.log("Unknown network, using Alfajores addresses");
            cUSDAddress = CUSD_ALFAJORES;
            hubV2Address = SELF_HUB_ALFAJORES;
        }
        
        console.log("cUSD Address:", cUSDAddress);
        console.log("Hub V2 Address:", hubV2Address);
        
        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy SusuFactory
        SusuFactory factory = new SusuFactory(
            cUSDAddress,
            hubV2Address,
            DEFAULT_CONFIG_ID
        );
        
        console.log("SusuFactory deployed at:", address(factory));
        console.log("-------------------------------------");
        console.log("SAVE THESE ADDRESSES:");
        console.log("Factory:", address(factory));
        console.log("cUSD:", cUSDAddress);
        console.log("Hub V2:", hubV2Address);
        console.log("-------------------------------------");
        
        // Verify deployer on the factory (for testing)
        factory.manualVerify(deployer);
        console.log("Deployer verified:", deployer);
        
        // Create a test pool (optional, comment out for production)
        /*
        address testPool = factory.createPool(
            10 ether, // 10 cUSD contribution
            7 days,   // 1 week cycles
            5         // 5 members max
        );
        console.log("Test pool created at:", testPool);
        */
        
        vm.stopBroadcast();
        
        console.log("Deployment complete!");
        console.log("-------------------------------------");
        console.log("Next steps:");
        console.log("1. Verify contracts on CeloScan (if not auto-verified)");
        console.log("2. Update frontend .env with Factory address");
        console.log("3. Update agent config with Factory address");
        console.log("4. Test pool creation on frontend");
    }
}
