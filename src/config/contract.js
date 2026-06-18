// src/config/contract.js

export const CONTRACT_ADDRESS = "0x08668ca6e0bFC4D30aCf5561b6d7A3ae9997758F";

// Set this to 11155111 when you deploy to Sepolia!
export const SEPOLIA_CHAIN_ID = 11155111; 

export const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
export const VERIFIER_ROLE = "0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09";

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bytes32", "name": "neededRole", "type": "bytes32" }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  { "inputs": [], "name": "AlreadyRegistered", "type": "error" },
  { "inputs": [], "name": "AlreadyVerified",   "type": "error" },
  { "inputs": [], "name": "CredentialExpired",  "type": "error" },
  { "inputs": [], "name": "DIDTaken",           "type": "error" },
  { "inputs": [], "name": "InvalidDataHash",    "type": "error" },
  { "inputs": [], "name": "InvalidDID",         "type": "error" },
  { "inputs": [], "name": "NotOwner",           "type": "error" },
  { "inputs": [], "name": "NotRegistered",      "type": "error" },
  { "inputs": [], "name": "NotVerified",        "type": "error" },
  { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
  { "inputs": [], "name": "ZeroAddress",        "type": "error" },

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "patient",        "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "verifier",       "type": "address" },
      { "indexed": false, "internalType": "string",  "name": "credentialType", "type": "string"  }
    ],
    "name": "CredentialIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "patient",   "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "IdentityDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "patient",   "type": "address" },
      { "indexed": false, "internalType": "string",  "name": "did",       "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "IdentityRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "patient",     "type": "address" },
      { "indexed": false, "internalType": "string",  "name": "newDataHash", "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",   "type": "uint256" }
    ],
    "name": "IdentityUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "patient",   "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "verifier",  "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "IdentityVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "role",              "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "previousAdminRole", "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "newAdminRole",      "type": "bytes32" }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "sender",  "type": "address" }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "sender",  "type": "address" }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "admin",    "type": "address" }
    ],
    "name": "VerifierGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "admin",    "type": "address" }
    ],
    "name": "VerifierRevoked",
    "type": "event"
  },

  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERIFIER_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deactivateIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient",        "type": "address" },
      { "internalType": "string",  "name": "credentialType", "type": "string"  },
      { "internalType": "string",  "name": "credentialHash", "type": "string"  },
      { "internalType": "uint64",  "name": "expiresAt",      "type": "uint64"  }
    ],
    "name": "issueCredential",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" }
    ],
    "name": "getCredentials",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "verifier",       "type": "address" },
          { "internalType": "uint64",  "name": "issuedAt",       "type": "uint64"  },
          { "internalType": "uint64",  "name": "expiresAt",      "type": "uint64"  },
          { "internalType": "string",  "name": "credentialType", "type": "string"  },
          { "internalType": "string",  "name": "credentialHash", "type": "string"  }
        ],
        "internalType": "struct EHealthIdentity.HealthCredential[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" }
    ],
    "name": "getIdentity",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "owner",        "type": "address" },
          { "internalType": "bool",    "name": "isVerified",   "type": "bool"    },
          { "internalType": "uint64",  "name": "registeredAt", "type": "uint64"  },
          { "internalType": "uint64",  "name": "lastUpdated",  "type": "uint64"  },
          { "internalType": "string",  "name": "did",          "type": "string"  },
          { "internalType": "string",  "name": "dataHash",     "type": "string"  },
          { "internalType": "string",  "name": "fullName",     "type": "string"  },
          { "internalType": "string",  "name": "bloodType",    "type": "string"  }
        ],
        "internalType": "struct EHealthIdentity.PatientIdentity",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      { "internalType": "uint256", "name": "registered", "type": "uint256" },
      { "internalType": "uint256", "name": "verified",   "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "getRoleAdmin",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "verifier", "type": "address" }
    ],
    "name": "grantVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" }
    ],
    "name": "isRegistered",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" }
    ],
    "name": "isVerified",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "did", "type": "string" }
    ],
    "name": "resolveDID",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "did",        "type": "string" },
      { "internalType": "string", "name": "dataHash",   "type": "string" },
      { "internalType": "string", "name": "fullName",   "type": "string" },
      { "internalType": "string", "name": "bloodType",  "type": "string" }
    ],
    "name": "registerIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "verifier", "type": "address" }
    ],
    "name": "revokeVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role",    "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }
    ],
    "name": "supportsInterface",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRegistered",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVerified",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "newDataHash", "type": "string" }
    ],
    "name": "updateDataHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" }
    ],
    "name": "verifyIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];