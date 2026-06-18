## EHealth Identity - Decentralized Identity Management

A blockchain-based identity system for e-health applications built on Ethereum, Hardhat, React, and Vite.

---

## Requirements

Make sure you have these installed before starting:

- [Node.js v18+](https://nodejs.org) - check with `node --version`
- [Git](https://git-scm.com) - check with `git --version`
- [MetaMask](https://metamask.io) - browser extension for your wallet

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
npm test
```

**4. Run coverage report**
```bash
npx hardhat coverage
```

---

## Run the Program with the UI

Use this flow when you want to run the smart contract locally and interact with it from the React browser UI.

Open **three** PowerShell/terminal windows in the project folder.

**Terminal 1 - start the local blockchain:**
```bash
npx hardhat node
```

Keep this terminal running. Hardhat will print test accounts with fake ETH and private keys.

**Terminal 2 - deploy the contract locally:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

The UI is configured for the default first Hardhat deployment address:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

If your terminal outputs a different deployment string, update `CONTRACT_ADDRESS` inside `src/config/contract.js`.

**Terminal 3 - start the React UI:**
```bash
npm run dev
```

Open the Vite URL printed in the terminal, usually:

```text
http://localhost:5173
```

**MetaMask setup for the local UI:**

1. Add or switch to the Hardhat local network:

| Field | Value |
|-------|-------|
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency symbol | `ETH` |

2. Import one of the private keys printed by `npx hardhat node` into MetaMask.
3. Refresh the UI and click **Connect MetaMask wallet**.

The first Hardhat account is the contract admin after local deployment. Use that account for admin actions such as granting or revoking healthcare provider verifier access.

---

## Deploy to Sepolia Testnet

**1. Create a `.env` file** in the project root:
```text
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY_HERE
VITE_PINATA_JWT=YOUR_PINATA_JWT_HERE
```

Get a free RPC URL at [alchemy.com](https://alchemy.com).
Get free Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com).
Export MetaMask private key from MetaMask > Account Details > Export Private Key.

**2. Deploy:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**3. Update the UI contract settings:**

In `src/config/contract.js`, update:

```js
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_SEPOLIA_CONTRACT_ADDRESS"; //0x08668ca6e0bFC4D30aCf5561b6d7A3ae9997758F
const SEPOLIA_CHAIN_ID = 11155111;
```

In `src/EHealthUI.jsx`, update:

```js
pinataJwt: "YOUR_PINATA_JWT",
```

Then run the UI:

```bash
npm run dev
```

**4. Verify on Etherscan (optional):**
```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## MetaMask Network Reference

| Field | Hardhat Local | Sepolia Testnet |
|-------|---------------|-----------------|
| RPC URL | `http://127.0.0.1:8545` | `https://rpc.sepolia.org` |
| Chain ID | `31337` | `11155111` |
| Symbol | `ETH` | `ETH` |

---

## Project Structure

```text
ehealth-identity/
|-- contracts/
|   `-- EHealthIdentity.sol       Smart contract
|-- scripts/
|   `-- deploy.js                 Deployment script
|-- src/
|   |-- App.jsx                   React app wrapper
|   |-- EHealthUI.jsx             Main browser UI
|   |-- EHealthIdentity_ABI.json  ABI used by the UI
|   `-- main.jsx                  Vite entry point
|-- test/
|   `-- EHealthIdentity.test.js   Automated tests
|-- docs/
|   |-- EHealthIdentity_ABI.json  ABI copy for frontend handoff
|   |-- TEAM_B_HANDOFF.md         Frontend integration guide
|   |-- gas-analysis.md           Gas cost table
|   `-- system-architecture.svg   Architecture diagram
|-- .env.example                  Template for your .env
|-- hardhat.config.js
|-- package.json
`-- vite.config.js
```

---

## Git Workflow

```bash
# Before starting work - get latest changes
git pull

# After making changes - push to GitHub
git add .
git commit -m "describe your change"
git push
```

---

## Important

- Never share or commit your `.env` file because it contains your private key.
- Never run `npm audit fix --force` because it may break dependencies.
- The `.env` file is already in `.gitignore` so it will not be uploaded.

---

## Common Errors

| Error | Fix |
|-------|-----|
| `'npx' is not recognized` | Restart terminal after installing Node.js |
| `Error HH404: File not found` | Run `npm install @openzeppelin/contracts --legacy-peer-deps` |
| `Cannot find module 'chai'` | Run `npm install --save-dev chai@4.4.1 --legacy-peer-deps` |
| `ECONNREFUSED` | Start `npx hardhat node` in a separate terminal first |
| `Network Mismatch` | Switch MetaMask to the network expected by `SEPOLIA_CHAIN_ID` in `src/EHealthUI.jsx` |
| `insufficient funds` | On local Hardhat, import a funded Hardhat account; on Sepolia, get Sepolia ETH |
| `git push rejected` | Run `git pull` first, then push again |
