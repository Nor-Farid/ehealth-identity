## EHealth Identity — Decentralized Identity Management

A blockchain-based identity system for e-health applications built on Ethereum (Sepolia Testnet).

---

## Requirements

Make sure you have these installed before starting:

- [Node.js v18+](https://nodejs.org) — check with `node --version`
- [Git](https://git-scm.com) — check with `git --version`
- [MetaMask](https://metamask.io) — browser extension for your wallet

---

## Getting Started

**1. Clone the repo**
```bash
git clone https://github.com/Nor-Farid/ehealth-identity.git
cd ehealth-identity
```

**2. Install dependencies**
```bash
npm install --legacy-peer-deps
```

**3. Run the tests**
```bash
npx hardhat test
```

**4. Run coverage report**
```bash
npx hardhat coverage
```

---

## Run a Local Demo (No Internet Needed)

Open **two** PowerShell/terminal windows:

**Terminal 1 — start local blockchain:**
```bash
npx hardhat node
```
> Keep this running. You'll see 20 test accounts with fake ETH printed.

**Terminal 2 — deploy the contract:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```
> Copy the `CONTRACT_ADDRESS` from the output — Team B needs this for the frontend.

---

## Deploy to Sepolia Testnet

**1. Create a `.env` file** in the project root:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY_HERE
```

> Get a free RPC URL at [alchemy.com](https://alchemy.com)  
> Get free Sepolia ETH at [sepoliafaucet.com](https://sepoliafaucet.com)  
> Export MetaMask private key: MetaMask → Account Details → Export Private Key

**2. Deploy:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**3. Verify on Etherscan (optional):**
```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## MetaMask Network Setup

| Field | Hardhat Local | Sepolia Testnet |
|-------|--------------|-----------------|
| RPC URL | `http://127.0.0.1:8545` | `https://rpc.sepolia.org` |
| Chain ID | `31337` | `11155111` |
| Symbol | `ETH` | `ETH` |

---

## Project Structure

```
ehealth-identity/
├── contracts/
│   └── EHealthIdentity.sol       ← Smart contract
├── scripts/
│   └── deploy.js                 ← Deployment script
├── test/
│   └── EHealthIdentity.test.js   ← 30 automated tests
├── docs/
│   ├── EHealthIdentity_ABI.json  ← ABI for Team B frontend
│   ├── TEAM_B_HANDOFF.md         ← Frontend integration guide
│   ├── gas-analysis.md           ← Gas cost table
│   └── system-architecture.svg  ← Architecture diagram
├── .env.example                  ← Template for your .env
└── hardhat.config.js
```

---

## Git Workflow

```bash
# Before starting work — get latest changes
git pull

# After making changes — push to GitHub
git add .
git commit -m "describe your change"
git push
```

---

## Important

- **Never share or commit your `.env` file** — it contains your private key
- **Never run `npm audit fix --force`** — it will break dependencies
- The `.env` file is already in `.gitignore` so it won't be uploaded

---

## Common Errors

| Error | Fix |
|-------|-----|
| `'npx' is not recognized` | Restart terminal after installing Node.js |
| `Error HH404: File not found` | Run `npm install @openzeppelin/contracts --legacy-peer-deps` |
| `Cannot find module 'chai'` | Run `npm install --save-dev chai@4.4.1 --legacy-peer-deps` |
| `ECONNREFUSED` | Start `npx hardhat node` in a separate terminal first |
| `insufficient funds` | Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com) |
| `git push rejected` | Run `git pull` first, then push again |