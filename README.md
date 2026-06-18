## EHealth Identity

This project lets you manage identity records on the blockchain and store files on IPFS.
If you are new to blockchain tools, follow the steps below in order.

---

## Quick start for beginners

Before you begin, make sure you have:

- [Node.js v18+](https://nodejs.org) — needed to run the project
- [Git](https://git-scm.com) — needed to download the project
- [MetaMask](https://metamask.io) — your wallet in the browser
- A free Sepolia RPC URL from [Alchemy](https://www.alchemy.com/) or another provider
- A free Etherscan API key from [Etherscan](https://etherscan.io/myapikey)
- A Pinata account for file uploads from [Pinata](https://www.pinata.cloud/)

> If something looks confusing, do not worry. You can follow the steps exactly as written.

---

## 1) Download and install the project

Open your terminal and run:

```bash
git clone https://github.com/Nor-Farid/ehealth-identity.git
cd ehealth-identity
npm install --legacy-peer-deps
```

If `npm install` gives an error, try the same command again once.

---

## 2) Create your `.env` file

A `.env` file stores secret values such as your wallet key and API keys.
Create a file called `.env` in the project root.

Here is a simple example:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE

# Pinata IPFS setup
VITE_PINATA_JWT=YOUR_PINATA_JWT_HERE
# OR use these instead:
# VITE_PINATA_API_KEY=YOUR_PINATA_API_KEY_HERE
# VITE_PINATA_SECRET_KEY=YOUR_PINATA_SECRET_KEY_HERE
```

### What each value means

- `SEPOLIA_RPC_URL`
  - This lets the app connect to the Sepolia test network.
  - Get it from [Alchemy](https://www.alchemy.com/) or another RPC provider.

- `PRIVATE_KEY`
  - This is your wallet key.
  - In MetaMask, go to **Account Details** → **Export Private Key**.
  - Paste the value into `.env`.
  - It must start with `0x`.

- `ETHERSCAN_API_KEY`
  - This is used to verify your contract on Etherscan.
  - Create one at [Etherscan](https://etherscan.io/myapikey).

- `VITE_PINATA_JWT`
  - This is the easiest way to upload files to IPFS.
  - Get it from your Pinata dashboard.

> Important: never share your `.env` file. It contains private information.

---

## 4) Test the smart contract

```bash
npm test
```

Optional coverage:

```bash
npx hardhat coverage
```

---

## 3) Run the app locally

If you want to test everything on your computer first, follow this flow.

Open **three separate terminals** in the project folder.

### Terminal 1 — start the blockchain

```bash
npx hardhat node
```

This creates a fake local blockchain and prints some test accounts.

### Terminal 2 — deploy the smart contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The app already expects this default contract address:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

If the deployment output shows a different address, update `CONTRACT_ADDRESS` in [src/EHealthUI.jsx](src/EHealthUI.jsx).

### Terminal 3 — start the frontend

```bash
npm run dev
```

After this, open the URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## 4) Connect MetaMask for local testing

1. In MetaMask, add a custom network:

| Field | Value |
|-------|-------|
| Network Name | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

2. Import one of the private keys shown by `npx hardhat node`.
3. Refresh the page and click **Connect MetaMask wallet**.

The first account is usually the contract admin.

---

## 6) Set up MetaMask for the local app

1. Open MetaMask and add a custom network:

| Field | Value |
|-------|-------|
| Network Name | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

2. Import one of the private keys printed by `npx hardhat node`.
3. Refresh the app and click **Connect MetaMask wallet**.

The first Hardhat account is the contract admin after deployment.

---

## 7) Deploy to Sepolia testnet

### Step 1 — Make sure `.env` is filled correctly

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE
VITE_PINATA_JWT=YOUR_PINATA_JWT_HERE
```

### Step 2 — Deploy the contract

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Step 3 — Update the frontend contract address

In [src/EHealthUI.jsx](src/EHealthUI.jsx), update:

```js
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_SEPOLIA_CONTRACT_ADDRESS";
const SEPOLIA_CHAIN_ID = 11155111;
```

### Step 4 — Run the frontend

```bash
npm run dev
```

### Step 5 — Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## 8) MetaMask network reference

| Field | Hardhat Local | Sepolia Testnet |
|-------|---------------|-----------------|
| RPC URL | `http://127.0.0.1:8545` | `https://rpc.sepolia.org` |
| Chain ID | `31337` | `11155111` |
| Symbol | `ETH` | `ETH` |

---

## 9) Pinata / IPFS setup

The UI uploads files to IPFS using Pinata.

You can use either:

- `VITE_PINATA_JWT` (recommended), or
- `VITE_PINATA_API_KEY` + `VITE_PINATA_SECRET_KEY`

Once a file is uploaded, the app stores the returned CID in the smart contract.

---

## 10) Project structure

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

## 11) Git workflow

```bash
# Before starting work - get latest changes
git pull

# After making changes - push to GitHub
git add .
git commit -m "describe your change"
git push
```

---

## 12) Important notes

- Never share or commit your `.env` file because it contains sensitive values.
- Never run `npm audit fix --force` because it may break dependencies.
- The `.env` file is already ignored by Git.

---

## 13) Common errors

| Error | Fix |
|-------|-----|
| `'npx' is not recognized` | Restart terminal after installing Node.js |
| `Error HH404: File not found` | Run `npm install @openzeppelin/contracts --legacy-peer-deps` |
| `Cannot find module 'chai'` | Run `npm install --save-dev chai@4.4.1 --legacy-peer-deps` |
| `ECONNREFUSED` | Start `npx hardhat node` in a separate terminal first |
| `Network Mismatch` | Switch MetaMask to the network expected by `SEPOLIA_CHAIN_ID` in [src/EHealthUI.jsx](src/EHealthUI.jsx) |
| `insufficient funds` | On local Hardhat, import a funded Hardhat account; on Sepolia, get Sepolia ETH |
| `git push rejected` | Run `git pull` first, then push again |
