const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, Connection } = require("@solana/web3.js");
const { getOrCreateAssociatedTokenAccount } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function initializeTestUsdcPool() {
  console.log("🚀 Initializing Test USDC Lending Pool on Devnet");
  console.log("");

  // Setup connection to Devnet
  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
    "confirmed"
  );

  // Load deployer wallet
  const walletPath = process.env.ANCHOR_WALLET || 
    path.join(__dirname, "..", "deployer-keypair.json");
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log("Authority:", wallet.publicKey.toString());

  // Get Test USDC mint from .env
  const testUsdcMint = new PublicKey(process.env.TEST_USDC_MINT!);
  console.log("Test USDC Mint:", testUsdcMint.toString());
  console.log("");

  // Load lending program
  const lendingIdl = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "target/idl/lending.json"), "utf-8")
  );
  const lendingProgram = new anchor.Program(
    lendingIdl,
    new PublicKey(process.env.LENDING_PROGRAM_ID),
    provider
  );
  console.log("Lending Program ID:", lendingProgram.programId.toString());
  console.log("");

  // ========================================
  // 1. Derive Lending Pool PDA
  // ========================================
  const [lendingPoolPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), testUsdcMint.toBuffer()],
    lendingProgram.programId
  );
  console.log("Lending Pool PDA:", lendingPoolPDA.toString());
  console.log("Bump:", bump);
  console.log("");

  // ========================================
  // 2. Create Pool Vault (Associated Token Account)
  // ========================================
  console.log("Creating pool vault...");
  const lendingVault = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    testUsdcMint,
    lendingPoolPDA,
    true // allowOwnerOffCurve - allows PDA to own the account
  );
  console.log("Pool Vault:", lendingVault.address.toString());
  console.log("");

  // ========================================
  // 3. Initialize Lending Pool
  // ========================================
  const INTEREST_RATE = 500; // 5% APR
  const MIN_DEPOSIT = 1_000_000; // 1 Test USDC (6 decimals)

  console.log("Initializing lending pool...");
  console.log("  Interest Rate:", INTEREST_RATE / 100, "%");
  console.log("  Min Deposit:", MIN_DEPOSIT / 1_000_000, "Test USDC");
  console.log("");

  try {
    const tx = await lendingProgram.methods
      .initializeLendingPool(
        new anchor.BN(INTEREST_RATE),
        new anchor.BN(MIN_DEPOSIT)
      )
      .accounts({
        lendingPool: lendingPoolPDA,
        tokenMint: testUsdcMint,
        poolVault: lendingVault.address,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Lending pool initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("");

    // Save pool info to .env
    const envPath = path.join(__dirname, "..", ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");
    
    if (!envContent.includes("LENDING_POOL_ADDRESS")) {
      envContent += `\n# Lending Pool Configuration\nLENDING_POOL_ADDRESS="${lendingPoolPDA.toString()}"\nLENDING_POOL_VAULT="${lendingVault.address.toString()}"\n`;
      fs.writeFileSync(envPath, envContent);
      console.log("✅ Pool addresses saved to .env");
    }
    console.log("");

    console.log("Summary:");
    console.log("========");
    console.log("Lending Pool PDA:", lendingPoolPDA.toString());
    console.log("Pool Vault:", lendingVault.address.toString());
    console.log("Token Mint:", testUsdcMint.toString());
    console.log("Interest Rate:", INTEREST_RATE / 100, "%");
    console.log("Min Deposit:", MIN_DEPOSIT / 1_000_000, "Test USDC");
    console.log("");
    console.log("🎉 You can now deposit Test USDC into the lending pool!");

  } catch (error) {
    if (error.message && error.message.includes("already in use")) {
      console.log("ℹ️  Lending pool already initialized");
      console.log("");
      console.log("Lending Pool PDA:", lendingPoolPDA.toString());
      console.log("Pool Vault:", lendingVault.address.toString());
    } else {
      console.error("❌ Error initializing lending pool:");
      console.error(error);
      throw error;
    }
  }
}

initializeTestUsdcPool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
