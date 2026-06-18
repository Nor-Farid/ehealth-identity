/**
 * @fileoverview Centralized contract configuration
 * Contains all contract-related constants separated from React components
 * for better maintainability and deployability
 */

export const CONTRACT_ADDRESS = "0x3b9877cf1Af43755aEF91A1a3B9415229Eae41d0";
export const SEPOLIA_CHAIN_ID = 11155111;

// Role Hashes (computed from keccak256)
export const ADMIN_ROLE    = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"; // keccak256("ADMIN_ROLE")
export const VERIFIER_ROLE = "0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09"; // keccak256("VERIFIER_ROLE")

// Contract ABI
export { default as CONTRACT_ABI } from "../EHealthIdentity_ABI.json";
