import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lending } from "../target/types/lending";
import { Borrowing } from "../target/types/borrowing";
import { ZkVerifiableCredentialManager } from "../target/types/zk_verifiable_credential_manager";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

interface DeploymentConfig {
  cluster: string;
  lendingPool: {
    address: string;
    tokenMint: string;
    vault: string;
  };
  collateralPool: {
    address: string;
    collateralMint: string;
    vault: string;
  };
}

async function checkStatus() {
  // Load deployment config
  const configPath = path.join(__dirname, "..", "deployment-config.json");
  
  if (!fs.existsSync(configPath)) {
    console.log("❌ Deployment configuration not found.");
    console.log("Run migration first: ./migrations/migrate.sh");
    process.exit(1);
  }

  const config: DeploymentConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );

  console.log("📊 Contract Status Check");
  console.log("========================\n");
  console.log("Cluster:", config.cluster);
  console.log("");

  // Setup connection
  const connection = new Connection(
    config.cluster === "localnet"
      ? "http://localhost:8899"
      : clusterApiUrl(config.cluster as any),
    "confirmed"
  );

  // Load programs (assuming they're in workspace)
  const lendingProgram = anchor.workspace.Lending as Program<Lending>;
  const borrowingProgram = anchor.workspace.Borrowing as Program<Borrowing>;

  // Check Lending Pool
  console.log("🏦 Lending Pool");
  console.log("---------------");
  try {
    const lendingPoolPDA = new PublicKey(config.lendingPool.address);
    const pool = await lendingProgram.account.lendingPool.fetch(lendingPoolPDA);
    
    console.log("✅ Pool is active");
    console.log("  Address:", config.lendingPool.address);
    console.log("  Token Mint:", pool.tokenMint.toString());
    console.log("  Total Deposits:", pool.totalDeposits.toString());
    console.log("  Total Borrowed:", pool.totalBorrowed.toString());
    console.log("  Interest Rate:", pool.interestRate.toNumber() / 100, "%");
    console.log("  Min Deposit:", pool.minDeposit.toString());
    
    const utilization = pool.totalDeposits.toNumber() > 0
      ? (pool.totalBorrowed.toNumber() / pool.totalDeposits.toNumber()) * 100
      : 0;
    console.log("  Utilization:", utilization.toFixed(2), "%");
  } catch (error) {
    console.log("❌ Pool not found or error:", error.message);
  }
  console.log("");

  // Check Collateral Pool
  console.log("🔒 Collateral Pool");
  console.log("------------------");
  try {
    const collateralPoolPDA = new PublicKey(config.collateralPool.address);
    const pool = await borrowingProgram.account.collateralPool.fetch(collateralPoolPDA);
    
    console.log("✅ Pool is active");
    console.log("  Address:", config.collateralPool.address);
    console.log("  Collateral Mint:", pool.collateralMint.toString());
    console.log("  Total Collateral:", pool.totalCollateral.toString());
    console.log("  Collateral Ratio:", pool.collateralRatio.toNumber() / 100, "%");
    console.log("  Liquidation Threshold:", pool.liquidationThreshold.toNumber() / 100, "%");
  } catch (error) {
    console.log("❌ Pool not found or error:", error.message);
  }
  console.log("");

  // Check program deployment
  console.log("📦 Programs");
  console.log("-----------");
  
  const programs = [
    { name: "ZK Credential Manager", id: anchor.workspace.ZkVerifiableCredentialManager.programId },
    { name: "Lending", id: lendingProgram.programId },
    { name: "Borrowing", id: borrowingProgram.programId },
  ];

  for (const program of programs) {
    try {
      const accountInfo = await connection.getAccountInfo(program.id);
      if (accountInfo && accountInfo.executable) {
        console.log(`✅ ${program.name}`);
        console.log(`   ID: ${program.id.toString()}`);
        console.log(`   Size: ${accountInfo.data.length} bytes`);
      } else {
        console.log(`❌ ${program.name} - Not executable`);
      }
    } catch (error) {
      console.log(`❌ ${program.name} - Not found`);
    }
  }
  console.log("");

  console.log("========================");
  console.log("Status check complete");
}

checkStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
