// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EHealthIdentity
 * @notice Decentralized Identity Management for E-Health Applications
 * @dev Implements DID-style identity with role-based access and reentrancy protection
 *
 * ROLES:
 *   ADMIN_ROLE       - Can grant/revoke verifier roles, pause system
 *   VERIFIER_ROLE    - Hospitals/clinics that can verify patient identities
 *   DEFAULT_ADMIN_ROLE - Contract deployer (super admin)
 *
 * IDENTITY LIFECYCLE:
 *   1. Patient registers via registerIdentity()
 *   2. Verifier (hospital) calls verifyIdentity()
 *   3. Patient can update or deactivate their record
 *   4. Anyone can call getIdentity() to read public info
 */
contract EHealthIdentity is AccessControl, ReentrancyGuard {
    // ─────────────────────────────────────────────
    // ROLES
    // ─────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ─────────────────────────────────────────────
    // STRUCTS  (packed for gas efficiency)
    // ─────────────────────────────────────────────

    /**
     * @dev Core patient identity record.
     *      Packed: bool + uint64 + uint64 fit in one 32-byte slot.
     */
    struct PatientIdentity {
        // Slot 1 (address = 20 bytes)
        address owner;

        // Slot 2 (bool 1 byte | uint64 8 bytes | uint64 8 bytes = 17 bytes → fits in slot)
        bool    isVerified;
        uint64  registeredAt;
        uint64  lastUpdated;

        // Slot 3
        string  did;            // e.g. "did:ehealth:0xABC..."
        string  dataHash;       // IPFS CID or SHA-256 hash of off-chain health record
        string  fullName;       // patient display name
        string  bloodType;      // "A+", "O-", etc.
    }

    /**
     * @dev Credential issued by a verifier (hospital/clinic).
     */
    struct HealthCredential {
        address verifier;       // who issued the credential
        uint64  issuedAt;
        uint64  expiresAt;      // 0 = no expiry
        string  credentialType; // "PatientID", "Vaccination", "Prescription"
        string  credentialHash; // hash of the off-chain credential document
    }

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────
    mapping(address => PatientIdentity)        private _identities;
    mapping(address => HealthCredential[])     private _credentials;
    mapping(address => bool)                   private _registered;
    mapping(string  => address)                private _didToAddress; // DID uniqueness

    uint256 public totalRegistered;
    uint256 public totalVerified;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────
    event IdentityRegistered(address indexed patient, string did, uint256 timestamp);
    event IdentityVerified  (address indexed patient, address indexed verifier, uint256 timestamp);
    event IdentityUpdated   (address indexed patient, string newDataHash, uint256 timestamp);
    event IdentityDeactivated(address indexed patient, uint256 timestamp);
    event CredentialIssued  (address indexed patient, address indexed verifier, string credentialType);
    event VerifierGranted   (address indexed verifier, address indexed admin);
    event VerifierRevoked   (address indexed verifier, address indexed admin);

    // ─────────────────────────────────────────────
    // ERRORS (cheaper than require strings)
    // ─────────────────────────────────────────────
    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyVerified();
    error NotVerified();
    error NotOwner();
    error InvalidDID();
    error DIDTaken();
    error InvalidDataHash();
    error CredentialExpired();
    error ZeroAddress();

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        // ADMIN_ROLE can manage VERIFIER_ROLE
        _setRoleAdmin(VERIFIER_ROLE, ADMIN_ROLE);
    }

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────
    modifier onlyRegistered(address patient) {
        if (!_registered[patient]) revert NotRegistered();
        _;
    }

    modifier onlyOwnerOf(address patient) {
        if (msg.sender != patient) revert NotOwner();
        _;
    }

    // ─────────────────────────────────────────────
    // PATIENT FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Register a new patient identity on-chain.
     * @param did        Decentralized Identifier string, must be unique
     * @param dataHash   IPFS CID or hash of the encrypted health record
     * @param fullName   Patient display name
     * @param bloodType  Blood type (stored for quick access in emergencies)
     *
     * CHECKS-EFFECTS-INTERACTIONS pattern applied:
     *   1. CHECKS  — validate inputs
     *   2. EFFECTS — update state
     *   3. INTERACTIONS — emit event (no external calls)
     */
    function registerIdentity(
        string calldata did,
        string calldata dataHash,
        string calldata fullName,
        string calldata bloodType
    ) external nonReentrant {
        // CHECKS
        if (_registered[msg.sender])          revert AlreadyRegistered();
        if (bytes(did).length == 0)           revert InvalidDID();
        if (_didToAddress[did] != address(0)) revert DIDTaken();
        if (bytes(dataHash).length == 0)      revert InvalidDataHash();

        // EFFECTS
        _registered[msg.sender]  = true;
        _didToAddress[did]        = msg.sender;
        totalRegistered          += 1;

        _identities[msg.sender] = PatientIdentity({
            owner:        msg.sender,
            isVerified:   false,
            registeredAt: uint64(block.timestamp),
            lastUpdated:  uint64(block.timestamp),
            did:          did,
            dataHash:     dataHash,
            fullName:     fullName,
            bloodType:    bloodType
        });

        // INTERACTIONS
        emit IdentityRegistered(msg.sender, did, block.timestamp);
    }

    /**
     * @notice Update the off-chain data hash (e.g. new IPFS CID after record update).
     * @dev Only the identity owner can update their own record.
     */
    function updateDataHash(string calldata newDataHash)
        external
        nonReentrant
        onlyRegistered(msg.sender)
        onlyOwnerOf(msg.sender)
    {
        if (bytes(newDataHash).length == 0) revert InvalidDataHash();

        // EFFECTS
        _identities[msg.sender].dataHash    = newDataHash;
        _identities[msg.sender].lastUpdated = uint64(block.timestamp);

        emit IdentityUpdated(msg.sender, newDataHash, block.timestamp);
    }

    /**
     * @notice Permanently deactivate (delete) your identity record.
     * @dev Frees storage (gas refund). DID is released for reuse.
     */
    function deactivateIdentity()
        external
        nonReentrant
        onlyRegistered(msg.sender)
        onlyOwnerOf(msg.sender)
    {
        string memory did = _identities[msg.sender].did;

        // EFFECTS — delete before event
        delete _didToAddress[did];
        delete _identities[msg.sender];
        delete _credentials[msg.sender];
        _registered[msg.sender] = false;

        emit IdentityDeactivated(msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // VERIFIER FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Mark a patient's identity as verified (e.g. hospital confirmed ID).
     * @dev Caller must have VERIFIER_ROLE.
     */
    function verifyIdentity(address patient)
        external
        nonReentrant
        onlyRole(VERIFIER_ROLE)
        onlyRegistered(patient)
    {
        if (_identities[patient].isVerified) revert AlreadyVerified();

        // EFFECTS
        _identities[patient].isVerified  = true;
        _identities[patient].lastUpdated = uint64(block.timestamp);
        totalVerified += 1;

        emit IdentityVerified(patient, msg.sender, block.timestamp);
    }

    /**
     * @notice Issue a health credential (e.g. vaccination record, prescription).
     * @param patient        Address of the patient
     * @param credentialType Short label: "Vaccination", "Prescription", "LabResult"
     * @param credentialHash Hash of the off-chain credential document
     * @param expiresAt      Unix timestamp of expiry; 0 = never expires
     */
    function issueCredential(
        address patient,
        string  calldata credentialType,
        string  calldata credentialHash,
        uint64  expiresAt
    )
        external
        nonReentrant
        onlyRole(VERIFIER_ROLE)
        onlyRegistered(patient)
    {
        if (!_identities[patient].isVerified) revert NotVerified();
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert CredentialExpired();

        // EFFECTS
        _credentials[patient].push(HealthCredential({
            verifier:       msg.sender,
            issuedAt:       uint64(block.timestamp),
            expiresAt:      expiresAt,
            credentialType: credentialType,
            credentialHash: credentialHash
        }));

        emit CredentialIssued(patient, msg.sender, credentialType);
    }

    // ─────────────────────────────────────────────
    // ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Grant VERIFIER_ROLE to a hospital/clinic address.
     */
    function grantVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        if (verifier == address(0)) revert ZeroAddress();
        _grantRole(VERIFIER_ROLE, verifier);
        emit VerifierGranted(verifier, msg.sender);
    }

    /**
     * @notice Revoke VERIFIER_ROLE from a verifier.
     */
    function revokeVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, verifier);
        emit VerifierRevoked(verifier, msg.sender);
    }

    // ─────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Get a patient's public identity record.
     */
    function getIdentity(address patient)
        external
        view
        onlyRegistered(patient)
        returns (PatientIdentity memory)
    {
        return _identities[patient];
    }

    /**
     * @notice Get all credentials issued to a patient.
     */
    function getCredentials(address patient)
        external
        view
        onlyRegistered(patient)
        returns (HealthCredential[] memory)
    {
        return _credentials[patient];
    }

    /**
     * @notice Look up a patient address from their DID string.
     */
    function resolveDID(string calldata did) external view returns (address) {
        return _didToAddress[did];
    }

    /**
     * @notice Check if an address has a registered identity.
     */
    function isRegistered(address patient) external view returns (bool) {
        return _registered[patient];
    }

    /**
     * @notice Check if an address has a verified identity.
     */
    function isVerified(address patient) external view returns (bool) {
        return _registered[patient] && _identities[patient].isVerified;
    }

    /**
     * @notice Returns summary statistics for the system.
     */
    function getStats() external view returns (uint256 registered, uint256 verified) {
        return (totalRegistered, totalVerified);
    }
}
