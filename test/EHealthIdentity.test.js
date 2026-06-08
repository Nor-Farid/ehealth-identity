// test/EHealthIdentity.test.js
// Pure Hardhat 2 + ethers v5 + chai v4
// No external chai plugins required — uses try/catch pattern for revert testing

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeDID     = (addr) => `did:ehealth:${addr.toLowerCase()}`;
const DATA_HASH   = "QmXgZAuFXq91c7NXs4p3QqFDgimfEAnvPKMGdJtW7YVBJL";
const DATA_HASH_2 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

// Asserts a tx reverts (with optional error name check)
async function shouldRevert(txPromise, errorName) {
  try {
    await txPromise;
    throw new Error("Expected transaction to revert, but it did not");
  } catch (err) {
    if (err.message === "Expected transaction to revert, but it did not") throw err;
    if (errorName) {
      expect(err.message).to.include(errorName,
        `Expected revert with "${errorName}" but got: ${err.message}`);
    }
  }
}

// Asserts a tx emits an event (checks event name exists in receipt)
async function shouldEmit(txPromise, eventName) {
  const tx      = await txPromise;
  const receipt = await tx.wait();
  const found   = receipt.events && receipt.events.some(e => e.event === eventName);
  expect(found, `Expected event "${eventName}" to be emitted`).to.equal(true);
  return receipt;
}

// ─── Shared state ─────────────────────────────────────────────────────────────
let contract, owner, verifier, patient1, patient2, attacker;
let ADMIN_ROLE, VERIFIER_ROLE;

async function deploy() {
  [owner, verifier, patient1, patient2, attacker] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("EHealthIdentity");
  contract = await Factory.deploy();
  await contract.deployed();
  ADMIN_ROLE    = await contract.ADMIN_ROLE();
  VERIFIER_ROLE = await contract.VERIFIER_ROLE();
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("EHealthIdentity", function () {

  // ── 1. DEPLOYMENT ────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    beforeEach(deploy);

    it("Deployer has DEFAULT_ADMIN_ROLE and ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(DEFAULT_ADMIN, owner.address)).to.equal(true);
      expect(await contract.hasRole(ADMIN_ROLE,    owner.address)).to.equal(true);
    });

    it("Starts with zero registered and verified counts", async function () {
      const [reg, ver] = await contract.getStats();
      expect(reg.toNumber()).to.equal(0);
      expect(ver.toNumber()).to.equal(0);
    });

    it("Deployer does NOT have VERIFIER_ROLE by default", async function () {
      expect(await contract.hasRole(VERIFIER_ROLE, owner.address)).to.equal(false);
    });
  });

  // ── 2. ROLE MANAGEMENT ───────────────────────────────────────────────────────
  describe("Role Management", function () {
    beforeEach(deploy);

    it("Admin can grant VERIFIER_ROLE", async function () {
      await contract.grantVerifier(verifier.address);
      expect(await contract.hasRole(VERIFIER_ROLE, verifier.address)).to.equal(true);
    });

    it("Admin can revoke VERIFIER_ROLE", async function () {
      await contract.grantVerifier(verifier.address);
      await contract.revokeVerifier(verifier.address);
      expect(await contract.hasRole(VERIFIER_ROLE, verifier.address)).to.equal(false);
    });

    it("Non-admin cannot grant VERIFIER_ROLE", async function () {
      await shouldRevert(
        contract.connect(attacker).grantVerifier(verifier.address)
      );
    });

    it("Reverts when granting role to zero address", async function () {
      await shouldRevert(
        contract.grantVerifier(ethers.constants.AddressZero),
        "ZeroAddress"
      );
    });
  });

  // ── 3. IDENTITY REGISTRATION ─────────────────────────────────────────────────
  describe("registerIdentity()", function () {
    beforeEach(deploy);

    it("Patient can register a new identity and emits IdentityRegistered", async function () {
      await shouldEmit(
        contract.connect(patient1).registerIdentity(
          makeDID(patient1.address), DATA_HASH, "Alice Tan", "A+"
        ),
        "IdentityRegistered"
      );
      expect(await contract.isRegistered(patient1.address)).to.equal(true);
    });

    it("totalRegistered increments on registration", async function () {
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "B+");
      const [reg] = await contract.getStats();
      expect(reg.toNumber()).to.equal(1);
    });

    it("Reverts on duplicate registration (same address)", async function () {
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "B+");
      await shouldRevert(
        contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "B+"),
        "AlreadyRegistered"
      );
    });

    it("Reverts on duplicate DID (different address)", async function () {
      const sameDID = "did:ehealth:shared-did";
      await contract.connect(patient1).registerIdentity(sameDID, DATA_HASH, "Alice", "B+");
      await shouldRevert(
        contract.connect(patient2).registerIdentity(sameDID, DATA_HASH, "Bob", "O-"),
        "DIDTaken"
      );
    });

    it("Reverts with empty DID", async function () {
      await shouldRevert(
        contract.connect(patient1).registerIdentity("", DATA_HASH, "Alice", "A+"),
        "InvalidDID"
      );
    });

    it("Reverts with empty dataHash", async function () {
      await shouldRevert(
        contract.connect(patient1).registerIdentity(makeDID(patient1.address), "", "Alice", "A+"),
        "InvalidDataHash"
      );
    });

    it("getIdentity returns correct fields", async function () {
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
      const id = await contract.getIdentity(patient1.address);
      expect(id.owner).to.equal(patient1.address);
      expect(id.did).to.equal(makeDID(patient1.address));
      expect(id.fullName).to.equal("Alice");
      expect(id.bloodType).to.equal("A+");
      expect(id.isVerified).to.equal(false);
      expect(id.dataHash).to.equal(DATA_HASH);
    });

    it("isRegistered returns false for unknown address", async function () {
      expect(await contract.isRegistered(attacker.address)).to.equal(false);
    });
  });

  // ── 4. IDENTITY VERIFICATION ─────────────────────────────────────────────────
  describe("verifyIdentity()", function () {
    beforeEach(async function () {
      await deploy();
      await contract.grantVerifier(verifier.address);
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
    });

    it("Verifier can verify a registered patient and emits IdentityVerified", async function () {
      await shouldEmit(
        contract.connect(verifier).verifyIdentity(patient1.address),
        "IdentityVerified"
      );
      expect(await contract.isVerified(patient1.address)).to.equal(true);
    });

    it("totalVerified increments on verification", async function () {
      await contract.connect(verifier).verifyIdentity(patient1.address);
      const [, ver] = await contract.getStats();
      expect(ver.toNumber()).to.equal(1);
    });

    it("Cannot verify a non-registered address", async function () {
      await shouldRevert(
        contract.connect(verifier).verifyIdentity(patient2.address),
        "NotRegistered"
      );
    });

    it("Cannot verify an already-verified patient", async function () {
      await contract.connect(verifier).verifyIdentity(patient1.address);
      await shouldRevert(
        contract.connect(verifier).verifyIdentity(patient1.address),
        "AlreadyVerified"
      );
    });

    it("Non-verifier cannot call verifyIdentity", async function () {
      await shouldRevert(
        contract.connect(attacker).verifyIdentity(patient1.address)
      );
    });
  });

  // ── 5. UPDATE DATA HASH ──────────────────────────────────────────────────────
  describe("updateDataHash()", function () {
    beforeEach(async function () {
      await deploy();
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
    });

    it("Owner can update their data hash and emits IdentityUpdated", async function () {
      await shouldEmit(
        contract.connect(patient1).updateDataHash(DATA_HASH_2),
        "IdentityUpdated"
      );
      const id = await contract.getIdentity(patient1.address);
      expect(id.dataHash).to.equal(DATA_HASH_2);
    });

    it("Non-registered address cannot call updateDataHash", async function () {
      await shouldRevert(
        contract.connect(attacker).updateDataHash(DATA_HASH_2),
        "NotRegistered"
      );
    });

    it("Reverts with empty dataHash", async function () {
      await shouldRevert(
        contract.connect(patient1).updateDataHash(""),
        "InvalidDataHash"
      );
    });
  });

  // ── 6. ISSUE CREDENTIAL ──────────────────────────────────────────────────────
  describe("issueCredential()", function () {
    beforeEach(async function () {
      await deploy();
      await contract.grantVerifier(verifier.address);
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
      await contract.connect(verifier).verifyIdentity(patient1.address);
    });

    it("Verifier can issue a credential and emits CredentialIssued", async function () {
      await shouldEmit(
        contract.connect(verifier).issueCredential(patient1.address, "Vaccination", "QmVaxHash", 0),
        "CredentialIssued"
      );
      const creds = await contract.getCredentials(patient1.address);
      expect(creds.length).to.equal(1);
      expect(creds[0].credentialType).to.equal("Vaccination");
      expect(creds[0].verifier).to.equal(verifier.address);
    });

    it("Cannot issue credential to unverified patient", async function () {
      await contract.connect(patient2).registerIdentity(makeDID(patient2.address), DATA_HASH, "Bob", "O-");
      await shouldRevert(
        contract.connect(verifier).issueCredential(patient2.address, "Prescription", "QmHash", 0),
        "NotVerified"
      );
    });

    it("Reverts if expiresAt is in the past", async function () {
      await shouldRevert(
        contract.connect(verifier).issueCredential(patient1.address, "Prescription", "QmHash", 1000),
        "CredentialExpired"
      );
    });

    it("Multiple credentials can be issued to same patient", async function () {
      await contract.connect(verifier).issueCredential(patient1.address, "Vaccination", "QmHash1", 0);
      await contract.connect(verifier).issueCredential(patient1.address, "LabResult",   "QmHash2", 0);
      const creds = await contract.getCredentials(patient1.address);
      expect(creds.length).to.equal(2);
    });

    it("Non-verifier cannot issue credential", async function () {
      await shouldRevert(
        contract.connect(attacker).issueCredential(patient1.address, "Vaccination", "QmHash", 0)
      );
    });
  });

  // ── 7. DEACTIVATE IDENTITY ───────────────────────────────────────────────────
  describe("deactivateIdentity()", function () {
    beforeEach(async function () {
      await deploy();
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
    });

    it("Owner can deactivate their identity and emits IdentityDeactivated", async function () {
      await shouldEmit(
        contract.connect(patient1).deactivateIdentity(),
        "IdentityDeactivated"
      );
      expect(await contract.isRegistered(patient1.address)).to.equal(false);
    });

    it("Deactivated DID can be re-registered by another address", async function () {
      const sharedDID = makeDID(patient1.address);
      await contract.connect(patient1).deactivateIdentity();
      // Should NOT revert
      await contract.connect(patient2).registerIdentity(sharedDID, DATA_HASH, "Bob", "O-");
      expect(await contract.isRegistered(patient2.address)).to.equal(true);
    });

    it("Non-registered address cannot deactivate", async function () {
      await shouldRevert(
        contract.connect(attacker).deactivateIdentity(),
        "NotRegistered"
      );
    });

    it("Cannot get identity after deactivation", async function () {
      await contract.connect(patient1).deactivateIdentity();
      await shouldRevert(
        contract.getIdentity(patient1.address),
        "NotRegistered"
      );
    });
  });

  // ── 8. RESOLVE DID ───────────────────────────────────────────────────────────
  describe("resolveDID()", function () {
    beforeEach(deploy);

    it("Resolves DID to correct address", async function () {
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
      expect(await contract.resolveDID(makeDID(patient1.address))).to.equal(patient1.address);
    });

    it("Returns zero address for unknown DID", async function () {
      expect(await contract.resolveDID("did:ehealth:unknown")).to.equal(ethers.constants.AddressZero);
    });
  });

  // ── 9. ACCESS CONTROL ────────────────────────────────────────────────────────
  describe("Access Control", function () {
    beforeEach(deploy);

    it("getIdentity reverts for unregistered address", async function () {
      await shouldRevert(
        contract.getIdentity(attacker.address),
        "NotRegistered"
      );
    });

    it("getCredentials reverts for unregistered address", async function () {
      await shouldRevert(
        contract.getCredentials(attacker.address),
        "NotRegistered"
      );
    });

    it("Supports IAccessControl interface (ERC-165)", async function () {
      expect(await contract.supportsInterface("0x7965db0b")).to.equal(true);
    });

    it("isVerified returns false for unregistered address", async function () {
      expect(await contract.isVerified(attacker.address)).to.equal(false);
    });

    it("isVerified returns false for registered but unverified patient", async function () {
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
      expect(await contract.isVerified(patient1.address)).to.equal(false);
    });
  });

  // ── 10. STATS ────────────────────────────────────────────────────────────────
  describe("getStats()", function () {
    beforeEach(deploy);

    it("Tracks registered and verified counts correctly", async function () {
      await contract.grantVerifier(verifier.address);
      await contract.connect(patient1).registerIdentity(makeDID(patient1.address), DATA_HASH, "Alice", "A+");
      await contract.connect(patient2).registerIdentity(makeDID(patient2.address), DATA_HASH, "Bob",   "O-");

      let [reg, ver] = await contract.getStats();
      expect(reg.toNumber()).to.equal(2);
      expect(ver.toNumber()).to.equal(0);

      await contract.connect(verifier).verifyIdentity(patient1.address);
      [reg, ver] = await contract.getStats();
      expect(reg.toNumber()).to.equal(2);
      expect(ver.toNumber()).to.equal(1);
    });
  });

});