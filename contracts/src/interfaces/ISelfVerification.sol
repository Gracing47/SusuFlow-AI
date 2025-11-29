// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISelfVerification
 * @dev Interface for Self Protocol verification
 * 
 * In production, this would integrate with the actual Self Protocol SDK.
 * For MVP testing, we use a simple mock implementation.
 */
interface ISelfVerification {
    /**
     * @dev Check if a user is verified through Self Protocol
     * @param user Address to check
     * @return True if user is verified
     */
    function isVerified(address user) external view returns (bool);
}
