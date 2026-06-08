// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network sepolia
// Or locally: npx hardhat run scripts/deploy.js --network hardhat

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("===========================================");
  console.log(" EHealth Identity — Deployment Script");
  console.log("===========================================");
  console.log(`Network   : ${hre.network.name}`);
  console.log(`Deployer  : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance   : ${hre.ethers.formatEther(balance)} ETH`);
  console.log("-------------------------------------------");

  // Deploy
  console.log("\n[1/3] Deploying EHealthIdentity contract...");
  const EHealthIdentity = await hre.ethers.getContractFactory("EHealthIdentity");
  const contract = await EHealthIdentity.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✓ Contract deployed at: ${contractAddress}`);

  // Post-deploy verification
  console.log("\n[2/3] Verifying initial state...");
  const [registered, verified] = await contract.getStats();
  console.log(`✓ totalRegistered: ${registered}`);
  console.log(`✓ totalVerified  : ${verified}`);

  const ADMIN_ROLE    = await contract.ADMIN_ROLE();
  const VERIFIER_ROLE = await contract.VERIFIER_ROLE();
  const hasAdmin = await contract.hasRole(ADMIN_ROLE, deployer.address);
  console.log(`✓ Deployer has ADMIN_ROLE: ${hasAdmin}`);

  // Summary for Team B
  console.log("\n[3/3] Saving deployment info...");
  const deployInfo = {
    network:         hre.network.name,
    contractAddress: contractAddress,
    deployer:        deployer.address,
    deployedAt:      new Date().toISOString(),
    roles: {
      ADMIN_ROLE:    ADMIN_ROLE,
      VERIFIER_ROLE: VERIFIER_ROLE,
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "docs/deployment.json",
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("✓ Deployment info saved to docs/deployment.json");
  console.log("\n===========================================");
  console.log(" TEAM B — COPY THESE VALUES INTO YOUR UI");
  console.log("===========================================");
  console.log(`CONTRACT_ADDRESS = "${contractAddress}"`);
  console.log(`NETWORK          = "sepolia" (chainId: 11155111)`);
  console.log(`ADMIN_ROLE       = "${ADMIN_ROLE}"`);
  console.log(`VERIFIER_ROLE    = "${VERIFIER_ROLE}"`);
  console.log("ABI file         = docs/EHealthIdentity_ABI.json");
  console.log("===========================================\n");

  // Etherscan verification hint
  if (hre.network.name === "sepolia") {
    console.log("To verify on Etherscan, run:");
    console.log(`  npx hardhat verify --network sepolia ${contractAddress}`);
    console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
