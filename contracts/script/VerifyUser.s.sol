// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title VerifyUser
 * @dev Script to verify a user address in the MockSelfVerification contract
 * 
 * Usage:
 *   forge script script/VerifyUser.s.sol:VerifyUser \
 *     --rpc-url https://forno.celo.org \
 *     --broadcast \
 *     --legacy \
 *     -vvvv
 */
contract VerifyUser is Script {
    // Self Verification contract address
    address constant SELF_VERIFICATION = 0xD0F4F5E2Af5106C4795eff98EEC6B46f8C71096b;
    
    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get the address to verify (can be same as deployer or different)
        // If you want to verify a different address, set USER_ADDRESS in .env
        address userToVerify;
        try vm.envAddress("USER_ADDRESS") returns (address addr) {
            userToVerify = addr;
        } catch {
            userToVerify = deployer;
        }
        
        console.log("====================================");
        console.log("Self Protocol User Verification");
        console.log("====================================");
        console.log("Self Verification Contract:", SELF_VERIFICATION);
        console.log("Verifying address:", userToVerify);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Call manualVerify
        (bool success, ) = SELF_VERIFICATION.call(
            abi.encodeWithSignature("manualVerify(address)", userToVerify)
        );
        
        require(success, "Verification failed");
        
        vm.stopBroadcast();
        
        console.log("====================================");
        console.log("Verification Complete!");
        console.log("====================================");
        console.log("Address", userToVerify, "is now verified");
        console.log("You can now create pools!");
        console.log("====================================");
    }
}
