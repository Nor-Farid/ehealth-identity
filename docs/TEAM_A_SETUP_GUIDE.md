# 🚀 Team A — Complete Setup & Demo Guide
## EHealth Decentralized Identity — How to Run Everything

---

## Prerequisites — Install These First

| Tool | Download | Why |
|------|----------|-----|
| Node.js (v18+) | https://nodejs.org | Runs Hardhat |
| MetaMask | https://metamask.io | Your blockchain wallet |
| Git | https://git-scm.com | (optional) version control |

---

## Part 1 — Run Locally (No Internet Needed, Instant Demo)

### Step 1 — Set up the project

```bash
# Clone or unzip the project folder, then:
cd ehealth-v2
npm install
```

### Step 2 — Start a local blockchain

Open **Terminal 1**, run:
```bash
npx hardhat node
```

This starts a local Ethereum blockchain. You'll see 20 test accounts printed.
**Copy the first private key** — that's your deployer.

Keep this terminal open!

### Step 3 — Deploy the contract locally

Open **Terminal 2**, run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

You'll see:
```
✓ Contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy the CONTRACT_ADDRESS** → paste it into Team B's UI code.

### Step 4 — Run the tests

```bash
npx hardhat test
```

Expected output:
```
  EHealthIdentity
    Deployment
      ✓ Should set the deployer as DEFAULT_ADMIN and ADMIN
      ✓ Should start with zero registered and verified counts
    Role Management
      ✓ Admin can grant VERIFIER_ROLE
      ✓ Admin can revoke VERIFIER_ROLE
      ...

  28 passing (3s)
```

### Step 5 — Run test coverage report

```bash
npx hardhat coverage
```

This generates a coverage report. Screenshot it for your report!

---

## Part 2 — Deploy to Sepolia Testnet (For Final Submission)

### Step 1 — Get a Sepolia RPC URL (free)

1. Go to https://alchemy.com → Sign up free
2. Create a new app → Select "Ethereum" → "Sepolia"
3. Copy your RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

### Step 2 — Get free Sepolia ETH

- https://sepoliafaucet.com (requires Alchemy account)
- https://faucet.sepolia.dev
- You need ~0.05 ETH to deploy

### Step 3 — Set up your .env file

Create a file called `.env` in the project root:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY_HERE
```

**⚠️ How to get your MetaMask private key:**
1. MetaMask → click your account name
2. Account Details → Export Private Key
3. Enter your MetaMask password
4. Copy the key → paste in .env

**⚠️ NEVER share your .env file or commit it to GitHub!**

### Step 4 — Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Wait ~30 seconds. You'll see:
```
✓ Contract deployed at: 0xABCDEF...
View on Etherscan: https://sepolia.etherscan.io/address/0xABCDEF...
```

### Step 5 — Verify on Etherscan (optional but impressive)

```bash
npx hardhat verify --network sepolia 0xYOUR_CONTRACT_ADDRESS
```

This makes the source code visible on Etherscan. Take a screenshot for your report!

---

## Part 3 — Demo Walkthrough (What to Show)

### Setup for demo:
- Have MetaMask open with 3 accounts ready:
  - **Account 1** = Admin (your deployer address)
  - **Account 2** = Hospital/Verifier
  - **Account 3** = Patient (Alice)

### Demo Flow:

#### Scene 1 — Admin Panel
1. Show MetaMask connected as Admin
2. Call `grantVerifier(Account2_address)` → Hospital now has verifier role
3. Show the transaction on Etherscan

#### Scene 2 — Patient Registration
1. Switch MetaMask to Account 3 (Alice)
2. In the UI, fill: Name = "Alice Tan", Blood Type = "A+"
3. Click Register → MetaMask popup appears → Confirm
4. Show the transaction confirms
5. Show Alice's identity card (shows "Not Verified" badge)

#### Scene 3 — Hospital Verification  
1. Switch MetaMask to Account 2 (Hospital)
2. Enter Alice's address
3. Click Verify → Confirm in MetaMask
4. Show transaction on Etherscan

#### Scene 4 — View Verified Identity
1. Switch back to Account 3 (Alice)
2. Refresh her identity card
3. It now shows ✅ Verified badge
4. Issue a "Vaccination" credential from hospital
5. Show credentials list

#### Scene 5 — Security Demo
1. Switch to Account 3 (Alice, not a verifier)
2. Try to call `verifyIdentity()` — show it REVERTS
3. Switch MetaMask to Ethereum Mainnet → show "Wrong Network" alert

---

## Part 4 — What to Screenshot for Report

1. ✅ **Hardhat test run** showing all tests passing
2. ✅ **Coverage report** showing ≥90% coverage
3. ✅ **Sepolia deployment transaction** on Etherscan
4. ✅ **Verified contract source** on Etherscan (green checkmark)
5. ✅ **Gas report** table from `npx hardhat test` (with REPORT_GAS=true)
6. ✅ **System architecture diagram** (docs/system-architecture.svg)

---

## Part 5 — Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx hardhat node` — port in use | Kill the process: `pkill -f hardhat` |
| Deploy fails — "insufficient funds" | Get more Sepolia ETH from faucet |
| MetaMask not connecting | Make sure you're on the right network |
| Contract call reverts | Check error message — see docs/TEAM_B_HANDOFF.md |
| `Error: cannot find module` | Run `npm install` again |

---

## File Structure Summary

```
ehealth-v2/
├── contracts/
│   └── EHealthIdentity.sol        ← THE SMART CONTRACT
├── scripts/
│   └── deploy.js                  ← Run this to deploy
├── test/
│   └── EHealthIdentity.test.js    ← Run: npx hardhat test
├── docs/
│   ├── EHealthIdentity_ABI.json   ← GIVE THIS TO TEAM B
│   ├── TEAM_B_HANDOFF.md          ← GIVE THIS TO TEAM B
│   ├── gas-analysis.md            ← For your report
│   ├── system-architecture.svg   ← For your report
│   └── deployment.json            ← Created after deploy
├── hardhat.config.js
├── package.json
└── .env                           ← Create this yourself (don't share!)
```
