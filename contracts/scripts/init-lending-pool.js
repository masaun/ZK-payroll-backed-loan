const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require("@solana/web3.js");
const { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function initializeLendingPool() {
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

  console.log("Authority:", walletKeypair.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log("Wallet balance:", balance / 1e9, "SOL");
  
  if (balance < 0.01 * 1e9) {
    console.log("❌ Insufficient balance. Need at least 0.01 SOL for transaction fee.");
    process.exit(1);
  }
  console.log("");

  // Get Test USDC mint from .env
  const testUsdcMint = new PublicKey(process.env.TEST_USDC_MINT);
  const lendingProgramId = new PublicKey(process.env.LENDING_PROGRAM_ID);
  
  console.log("Test USDC Mint:", testUsdcMint.toString());
  console.log("Lending Program ID:", lendingProgramId.toString());
  console.log("");

  // ========================================
  // 1. Derive Lending Pool PDA
  // ========================================
  const [lendingPoolPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), testUsdcMint.toBuffer()],
    lendingProgramId
  );
  console.log("Lending Pool PDA:", lendingPoolPDA.toString());
  console.log("Bump:", bump);
  console.log("");

  // ========================================
  // 2. Derive Pool Vault (Associated Token Account)
  // ========================================
  const lendingVault = getAssociatedTokenAddressSync(
    testUsdcMint,
    lendingPoolPDA,
    true // allowOwnerOffCurve - allows PDA to own the account
  );
  console.log("Pool Vault:", lendingVault.toString());
  console.log("");

  // ========================================
  // 3. Check if vault exists, create if not
  // ========================================
  const vaultAccountInfo = await connection.getAccountInfo(lendingVault);
  
  if (!vaultAccountInfo) {
    console.log("Creating pool vault (associated token account)...");
    const createVaultIx = createAssociatedTokenAccountInstruction(
      walletKeypair.publicKey, // payer
      lendingVault, // ata
      lendingPoolPDA, // owner
      testUsdcMint // mint
    );
    
    const vaultTx = new Transaction().add(createVaultIx);
    const { blockhash: vaultBlockhash } = await connection.getLatestBlockhash();
    vaultTx.recentBlockhash = vaultBlockhash;
    vaultTx.feePayer = walletKeypair.publicKey;
    vaultTx.sign(walletKeypair);
    
    const vaultSig = await connection.sendRawTransaction(vaultTx.serialize());
    await connection.confirmTransaction(vaultSig);
    console.log("✅ Pool vault created:", vaultSig);
    console.log("");
  } else {
    console.log("✅ Pool vault already exists");
    console.log("");
  }

  // ========================================
  // 4. Build Initialize Instruction
  // ========================================
  const INTEREST_RATE = 500; // 5% APR
  const MIN_DEPOSIT = 1_000_000; // 1 Test USDC (6 decimals)

  console.log("Initializing lending pool...");
  console.log("  Interest Rate:", INTEREST_RATE / 100, "%");
  console.log("  Min Deposit:", MIN_DEPOSIT / 1_000_000, "Test USDC");
  console.log("");

  // Correct discriminator from IDL: [236, 76, 136, 68, 196, 14, 9, 177]
  const discriminator = Buffer.from([236, 76, 136, 68, 196, 14, 9, 177]);
  
  // Encode arguments (interest_rate: u64, min_deposit: u64)
  const interestRateBuffer = Buffer.alloc(8);
  interestRateBuffer.writeBigUInt64LE(BigInt(INTEREST_RATE));
  
  const minDepositBuffer = Buffer.alloc(8);
  minDepositBuffer.writeBigUInt64LE(BigInt(MIN_DEPOSIT));
  
  const data = Buffer.concat([discriminator, interestRateBuffer, minDepositBuffer]);

  const initInstruction = new TransactionInstruction({
    keys: [
      { pubkey: lendingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: testUsdcMint, isSigner: false, isWritable: false },
      { pubkey: lendingVault, isSigner: false, isWritable: false },
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: lendingProgramId,
    data,
  });

  // ========================================
  // 5. Send Transaction
  // ========================================
  try {
    const transaction = new Transaction().add(initInstruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletKeypair.publicKey;

    // Sign and send
    transaction.sign(walletKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log("Transaction sent:", signature);
    console.log("Confirming...");
    
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    });

    console.log("");
    console.log("✅ Lending pool initialized successfully!");
    console.log("");
    console.log("Summary:");
    console.log("========");
    console.log("Transaction:", signature);
    console.log("Lending Pool PDA:", lendingPoolPDA.toString());
    console.log("Pool Vault:", lendingVault.toString());
    console.log("Token Mint:", testUsdcMint.toString());
    console.log("Interest Rate:", INTEREST_RATE / 100, "%");
    console.log("Min Deposit:", MIN_DEPOSIT / 1_000_000, "Test USDC");
    console.log("");
    console.log("🎉 You can now deposit Test USDC into the lending pool!");
    console.log("");
    console.log("View on Solana Explorer:");
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`https://explorer.solana.com/address/${lendingPoolPDA.toString()}?cluster=devnet`);

  } catch (error) {
    console.error("");
    console.error("❌ Error initializing lending pool:");
    
    if (error.message && error.message.includes("already in use")) {
      console.error("");
      console.error("ℹ️  The lending pool is already initialized!");
      console.error("");
      console.error("Pool Details:");
      console.error("  Lending Pool PDA:", lendingPoolPDA.toString());
      console.error("  Pool Vault:", lendingVault.toString());
      console.error("");
      console.error("You can proceed to deposit Test USDC.");
      process.exit(0);
    } else {
      console.error(error);
      console.error("");
      console.error("Logs:");
      if (error.logs) {
        error.logs.forEach(log => console.error("  ", log));
      }
      process.exit(1);
    }
  }
}

initializeLendingPool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
