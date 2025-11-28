// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISelfVerificationRoot
 * @dev Interface for Self Protocol's verification system
 * Based on Self Protocol SDK documentation
 */
interface ISelfVerificationRoot {
    struct GenericDiscloseOutputV2 {
        bytes32 userIdentifier;
        bytes32 destinationChainId;
        bytes disclosedAttributes;
    }

    function verifySelfProof(bytes calldata proofPayload, bytes calldata userContextData) external;
}

/**
 * @title SelfVerificationRootMock
 * @dev Abstract contract providing Self Protocol identity verification
 * For the hackathon MVP, we'll implement a simplified version
 * In production, this would inherit from Self Protocol contracts
 */
abstract contract SelfVerificationRootMock {
    // Mapping of verified users
    mapping(address => bool) public isVerified;
    
    // Hub V2 address (on Celo Mainnet: 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF)
    address public immutable hubV2;
    uint256 public immutable scope;
    
    event UserVerified(address indexed user, bytes32 userIdentifier);
    
    constructor(address _hubV2, uint256 _scopeSeed) {
        hubV2 = _hubV2;
        // Compute scope (simplified for MVP)
        scope = uint256(keccak256(abi.encodePacked(address(this), _scopeSeed)));
    }
    
    /**
     * @dev Override this to return the verification configuration ID
     */
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view virtual returns (bytes32);
    
    /**
     * @dev Custom logic hook called after successful verification
     * Override in your contract to implement post-verification logic
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal virtual;
    
    /**
     * @dev For MVP: Manual verification (in production, use real Self Protocol)
     * This allows testing without requiring real passport scans
     */
    function manualVerify(address user) external {
        require(!isVerified[user], "Already verified");
        isVerified[user] = true;
        emit UserVerified(user, bytes32(uint256(uint160(user))));
    }
    
    /**
     * @dev Modifier to restrict access to verified users only
     */
    modifier onlyVerified() {
        require(isVerified[msg.sender], "User not verified");
        _;
    }
}
