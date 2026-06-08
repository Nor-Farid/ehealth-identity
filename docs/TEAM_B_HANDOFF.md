# 📋 Team B Handoff Notes
## From: Team A (Backend & Security)
## Project: Decentralized Identity Management for E-Health Applications

---

## ✅ What We're Delivering to You

| File | Purpose |
|------|---------|
| `contracts/EHealthIdentity.sol` | The complete Solidity smart contract |
| `docs/EHealthIdentity_ABI.json` | **Most important for you** — paste this into your JS code |
| `docs/system-architecture.svg` | Architecture diagram (use in report) |
| `docs/gas-analysis.md` | Gas cost table (use in report) |
| `scripts/deploy.js` | Deployment script (we run this, gives you the address) |
| `test/EHealthIdentity.test.js` | Our automated tests (for our section of report) |

---

## 🔑 What You Need From Us After Deployment

Once we deploy to Sepolia, we will give you:

```
CONTRACT_ADDRESS = "0x..."          ← paste this into your JS file
NETWORK_CHAIN_ID = 11155111         ← this is Sepolia testnet
ABI_FILE         = EHealthIdentity_ABI.json  ← already delivered
```

---

## 🧩 How to Connect Your React/HTML UI to the Contract

### Step 1 — Install ethers.js
```bash
npm install ethers
```

### Step 2 — Copy this starter code into your main JS file

```javascript
import { ethers } from "ethers";
import CONTRACT_ABI from "./EHealthIdentity_ABI.json";

// ← Team A fills this in after deployment
const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE";
const SEPOLIA_CHAIN_ID = 11155111;

// Connect MetaMask
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return null;
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  
  // ⚠️ Check network — IMPORTANT for "Wrong Network" alert
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    alert("❌ Wrong Network! Please switch MetaMask to Sepolia Testnet.");
    return null;
  }
  
  const signer = await provider.getSigner();
  console.log("Connected wallet:", await signer.getAddress());
  return signer;
}

// Get the contract instance
async function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}
```

---

## 📌 All Functions You Need to Call

### 🔵 PATIENT Actions (user calls with their own wallet)

**Register Identity:**
```javascript
async function registerIdentity(signer, fullName, bloodType) {
  const contract = await getContract(signer);
  const address  = await signer.getAddress();
  
  // DID format: "did:ehealth:0xADDRESS"
  const did      = `did:ehealth:${address.toLowerCase()}`;
  
  // dataHash: For demo, use a placeholder IPFS hash
  // In production this would be a real IPFS CID of their health record
  const dataHash = "QmExampleIPFSHashForDemo";
  
  const tx = await contract.registerIdentity(did, dataHash, fullName, bloodType);
  await tx.wait(); // Wait for confirmation
  console.log("Identity registered! Tx:", tx.hash);
}
```

**View Identity:**
```javascript
async function getIdentity(provider, patientAddress) {
  const contract = await getContract(provider);
  const identity = await contract.getIdentity(patientAddress);
  
  return {
    owner:        identity.owner,
    isVerified:   identity.isVerified,
    did:          identity.did,
    fullName:     identity.fullName,
    bloodType:    identity.bloodType,
    registeredAt: new Date(Number(identity.registeredAt) * 1000).toLocaleDateString()
  };
}
```

**Update Health Data:**
```javascript
async function updateDataHash(signer, newHash) {
  const contract = await getContract(signer);
  const tx = await contract.updateDataHash(newHash);
  await tx.wait();
}
```

---

### 🟢 HOSPITAL/VERIFIER Actions (hospital wallet must have VERIFIER_ROLE)

**Verify a Patient:**
```javascript
async function verifyPatient(signer, patientAddress) {
  const contract = await getContract(signer);
  const tx = await contract.verifyIdentity(patientAddress);
  await tx.wait();
  console.log(`Patient ${patientAddress} verified!`);
}
```

**Issue a Health Credential:**
```javascript
async function issueCredential(signer, patientAddress, credentialType) {
  const contract = await getContract(signer);
  
  // credentialType: "Vaccination", "Prescription", "LabResult"
  // credentialHash: hash of the actual document (use placeholder for demo)
  // expiresAt: 0 = never expires
  const tx = await contract.issueCredential(
    patientAddress,
    credentialType,
    "QmCredentialHashExample",
    0  // no expiry
  );
  await tx.wait();
}
```

**Get a Patient's Credentials:**
```javascript
async function getCredentials(provider, patientAddress) {
  const contract = await getContract(provider);
  const creds    = await contract.getCredentials(patientAddress);
  return creds.map(c => ({
    type:       c.credentialType,
    verifier:   c.verifier,
    issuedAt:   new Date(Number(c.issuedAt) * 1000).toLocaleDateString(),
    expiresAt:  c.expiresAt == 0 ? "Never" : new Date(Number(c.expiresAt) * 1000).toLocaleDateString()
  }));
}
```

---

### 🟡 ADMIN Actions (only the deployer wallet)

**Grant Hospital VERIFIER_ROLE:**
```javascript
async function grantVerifier(signer, hospitalAddress) {
  const contract = await getContract(signer);
  const tx = await contract.grantVerifier(hospitalAddress);
  await tx.wait();
  console.log(`${hospitalAddress} is now a Verifier!`);
}
```

---

## ⚠️ Error Handling — What Each Error Means

Add try/catch around every contract call:

```javascript
try {
  await contract.registerIdentity(...);
} catch (error) {
  if (error.message.includes("AlreadyRegistered")) {
    alert("You already have a registered identity!");
  } else if (error.message.includes("DIDTaken")) {
    alert("This DID is already taken. Try a different identifier.");
  } else if (error.message.includes("NotRegistered")) {
    alert("This address has no identity on record.");
  } else if (error.message.includes("NotVerified")) {
    alert("Patient must be verified first before credentials can be issued.");
  } else if (error.message.includes("user rejected")) {
    alert("Transaction was cancelled in MetaMask.");
  } else {
    alert("Transaction failed: " + error.message);
  }
}
```

---

## 🎬 Demo Script (for the Demonstration Video)

Run through this flow in order for the demo:

1. **Connect MetaMask** → Show wallet address displayed in UI
2. **Register Identity** → Fill name "Alice", blood type "A+", click Register → MetaMask popup → confirm
3. **View Identity** → Show the identity card (unverified badge)
4. **Switch to Hospital wallet** in MetaMask → Verify Alice's identity
5. **Switch back to Alice** → Show identity card now shows ✅ Verified
6. **Issue Credential** → Hospital issues "Vaccination" credential
7. **View Credentials** → Alice's credential list shows the vaccination record
8. **Test Wrong Network** → Switch MetaMask to Ethereum mainnet → Show alert

---

## 📐 Role Values (for hasRole checks in UI)

If you need to check what role a user has:

```javascript
const ADMIN_ROLE    = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a755a8c47d4b1b3a9b0b9c9d5"; // keccak256("ADMIN_ROLE")
const VERIFIER_ROLE = "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5"; // keccak256("VERIFIER_ROLE")

// Check if connected user is a verifier:
const isVerifier = await contract.hasRole(VERIFIER_ROLE, userAddress);
```

> **Note:** We will confirm the exact role hash values after deployment.

---

## 🌐 MetaMask — Sepolia Setup

Tell your team to:
1. Open MetaMask → Networks dropdown → Add Network
2. Add Sepolia: RPC `https://rpc.sepolia.org`, Chain ID `11155111`, Symbol `ETH`
3. Get free test ETH from: **https://sepoliafaucet.com** (needs Alchemy account)
4. Or: **https://faucet.sepolia.dev**

---

## 📦 Events You Can Listen To (for live UI updates)

```javascript
// Listen for new registrations:
contract.on("IdentityRegistered", (patient, did, timestamp, event) => {
  console.log(`New identity: ${patient} → ${did}`);
  // Update your UI here
});

// Listen for verifications:
contract.on("IdentityVerified", (patient, verifier, timestamp) => {
  console.log(`Patient ${patient} verified by ${verifier}`);
});

// Listen for new credentials:
contract.on("CredentialIssued", (patient, verifier, credentialType) => {
  console.log(`${credentialType} issued to ${patient}`);
});
```

---

## ❓ Questions?

Contact Team A if:
- The contract address or ABI is needed (after we deploy)
- Any function call returns an unexpected error
- You need us to grant VERIFIER_ROLE to a specific test wallet

We recommend testing on **localhost (Hardhat node)** first before Sepolia.
