import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lending } from "../target/types/lending";
import { Borrowing } from "../target/types/borrowing";
import { 
  Connection, 
  Keypair, 
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  createMint, 
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

interface DeploymentConfig {
  cluster: string;
  lendingPool: {
    address: string;
    tokenMint: string;
    vault: string;
    interestRate: number;
    minDeposit: number;
  };
  collateralPool: {
    address: string;
    collateralMint: string;
    vault: string;
    collateralRatio: number;
    liquidationThreshold: number;
  };
  timestamp: number;
}

async function initialize() {
  const cluster = process.argv[2] || "localnet";
  console.log("🚀 Initializing contracts on", cluster);
  console.log("");

  // Setup connection
  const connection = new Connection(
    cluster === "localnet" 
      ? "http://localhost:8899" 
      : clusterApiUrl(cluster as any),
    "confirmed"
  );

  // Load wallet
  const walletPath = process.env.ANCHOR_WALLET || 
    path.join(process.env.HOME!, ".config/solana/id.json");
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log("Authority:", wallet.publicKey.toString());
  console.log("");

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
  
  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log("⚠️  Low balance. Requesting airdrop...");
    if (cluster === "devnet" || cluster === "localnet") {
      const sig = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
      console.log("✅ Airdrop received");
    } else {
      console.log("❌ Insufficient balance for mainnet deployment");
      process.exit(1);
    }
  }
  console.log("");

  // Load programs
  const lendingProgram = anchor.workspace.Lending as Program<Lending>;
  const borrowingProgram = anchor.workspace.Borrowing as Program<Borrowing>;

  // ========================================
  // 1. Create Token Mints
  // ========================================
  console.log("💰 Creating token mints...");
  
  // Create USDC mock (lending token)
  const usdcMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    null,
    6 // USDC decimals
  );
  console.log("  USDC Mint:", usdcMint.toString());

  // Create collateral token (e.g., wrapped SOL)
  const collateralMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    null,
    9 // SOL decimals
  );
  console.log("  Collateral Mint:", collateralMint.toString());
  console.log("");

  // ========================================
  // 2. Initialize Lending Pool
  // ========================================
  console.log("🏦 Initializing lending pool...");

  const [lendingPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), usdcMint.toBuffer()],
    lendingProgram.programId
  );

  const lendingVault = await createAccount(
    connection,
    walletKeypair,
    usdcMint,
    lendingPoolPDA
  );

  const INTEREST_RATE = 500; // 5%
  const MIN_DEPOSIT = 1_000_000; // 1 USDC

  try {
    const tx = await lendingProgram.methods
      .initializeLendingPool(
        new anchor.BN(INTEREST_RATE),
        new anchor.BN(MIN_DEPOSIT)
      )
      .accounts({
        lendingPool: lendingPoolPDA,
        tokenMint: usdcMint,
        poolVault: lendingVault,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✅ Lending pool initialized");
    console.log("  Transaction:", tx);
    console.log("  Pool PDA:", lendingPoolPDA.toString());
    console.log("  Vault:", lendingVault.toString());
  } catch (error) {
    console.log("  ℹ️  Lending pool already initialized or error:", error.message);
  }
  console.log("");

  // ========================================
  // 3. Initialize Collateral Pool
  // ========================================
  console.log("🔒 Initializing collateral pool...");

  const [collateralPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("collateral_pool"), collateralMint.toBuffer()],
    borrowingProgram.programId
  );

  const collateralVault = await createAccount(
    connection,
    walletKeypair,
    collateralMint,
    collateralPoolPDA
  );

  const COLLATERAL_RATIO = 15000; // 150%
  const LIQUIDATION_THRESHOLD = 12000; // 120%

  try {
    const tx = await borrowingProgram.methods
      .initializeCollateralPool(
        new anchor.BN(COLLATERAL_RATIO),
        new anchor.BN(LIQUIDATION_THRESHOLD)
      )
      .accounts({
        collateralPool: collateralPoolPDA,
        collateralMint: collateralMint,
        poolVault: collateralVault,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✅ Collateral pool initialized");
    console.log("  Transaction:", tx);
    console.log("  Pool PDA:", collateralPoolPDA.toString());
    console.log("  Vault:", collateralVault.toString());
  } catch (error) {
    console.log("  ℹ️  Collateral pool already initialized or error:", error.message);
  }
  console.log("");

  // ========================================
  // 4. Save Deployment Configuration
  // ========================================
  const config: DeploymentConfig = {
    cluster,
    lendingPool: {
      address: lendingPoolPDA.toString(),
      tokenMint: usdcMint.toString(),
      vault: lendingVault.toString(),
      interestRate: INTEREST_RATE,
      minDeposit: MIN_DEPOSIT,
    },
    collateralPool: {
      address: collateralPoolPDA.toString(),
      collateralMint: collateralMint.toString(),
      vault: collateralVault.toString(),
      collateralRatio: COLLATERAL_RATIO,
      liquidationThreshold: LIQUIDATION_THRESHOLD,
    },
    timestamp: Date.now(),
  };

  const configPath = path.join(__dirname, "..", "deployment-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log("📝 Deployment configuration saved to:", configPath);
  console.log("");

  console.log("✅ Initialization completed successfully!");
  console.log("");
  console.log("Summary:");
  console.log("========");
  console.log("Cluster:", cluster);
  console.log("Authority:", wallet.publicKey.toString());
  console.log("");
  console.log("Lending Pool:");
  console.log("  Address:", lendingPoolPDA.toString());
  console.log("  Token:", usdcMint.toString());
  console.log("  Interest Rate:", INTEREST_RATE / 100, "%");
  console.log("");
  console.log("Collateral Pool:");
  console.log("  Address:", collateralPoolPDA.toString());
  console.log("  Token:", collateralMint.toString());
  console.log("  Collateral Ratio:", COLLATERAL_RATIO / 100, "%");
  console.log("  Liquidation Threshold:", LIQUIDATION_THRESHOLD / 100, "%");
}

initialize()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during initialization:", error);
    process.exit(1);
  });
