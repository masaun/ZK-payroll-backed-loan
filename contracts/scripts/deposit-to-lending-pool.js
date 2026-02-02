const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function depositToLendingPool() {
  const depositAmount = process.argv[2] ? parseFloat(process.argv[2]) : 1000; // Default 1000 Test USDC
  
  console.log("💰 Depositing Test USDC to Lending Pool");
  console.log("Amount:", depositAmount, "Test USDC");
  console.log("");

  // Setup connection
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

  console.log("Depositor:", walletKeypair.publicKey.toString());

  // Get addresses from .env
  const testUsdcMint = new PublicKey(process.env.TEST_USDC_MINT);
  const lendingProgramId = new PublicKey(process.env.LENDING_PROGRAM_ID);
  
  // Derive lending pool PDA
  const [lendingPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), testUsdcMint.toBuffer()],
    lendingProgramId
  );
  
  // Derive pool vault
  const poolVault = getAssociatedTokenAddressSync(
    testUsdcMint,
    lendingPoolPDA,
    true
  );
  
  // Derive depositor account PDA
  const [depositorAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("depositor"), walletKeypair.publicKey.toBuffer(), lendingPoolPDA.toBuffer()],
    lendingProgramId
  );
  
  // Get depositor's token account
  const depositorTokenAccount = getAssociatedTokenAddressSync(
    testUsdcMint,
    walletKeypair.publicKey
  );

  console.log("Lending Pool:", lendingPoolPDA.toString());
  console.log("Pool Vault:", poolVault.toString());
  console.log("Depositor Token Account:", depositorTokenAccount.toString());
  console.log("Depositor Account PDA:", depositorAccountPDA.toString());
  console.log("");

  // Check depositor balance
  try {
    const tokenAccountInfo = await connection.getTokenAccountBalance(depositorTokenAccount);
    const balance = parseFloat(tokenAccountInfo.value.uiAmount || "0");
    console.log("Your Test USDC balance:", balance);
    
    if (balance < depositAmount) {
      console.log("❌ Insufficient balance. You have", balance, "Test USDC");
      console.log("💡 Mint more Test USDC first: npm run mint-test-usdc");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ No Test USDC token account found");
    console.log("💡 Mint Test USDC first: npm run mint-test-usdc");
    process.exit(1);
  }

  // Build deposit instruction
  const amountLamports = BigInt(Math.floor(depositAmount * 1_000_000)); // 6 decimals
  
  // Discriminator for deposit_into_lending_pool from IDL
  const discriminator = Buffer.from([3, 250, 204, 232, 7, 192, 142, 181]);
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amountLamports);
  const data = Buffer.concat([discriminator, amountBuffer]);

  const depositIx = new TransactionInstruction({
    keys: [
      { pubkey: lendingPoolPDA, isSigner: false, isWritable: true },  // lending_pool
      { pubkey: depositorAccountPDA, isSigner: false, isWritable: true },  // depositor_account
      { pubkey: poolVault, isSigner: false, isWritable: true },  // pool_vault
      { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },  // depositor_token_account
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },  // depositor
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },  // token_program
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false }, // system_program
    ],
    programId: lendingProgramId,
    data,
  });

  // Send transaction
  try {
    const tx = new Transaction().add(depositIx);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = walletKeypair.publicKey;
    tx.sign(walletKeypair);

    console.log("Sending transaction...");
    const signature = await connection.sendRawTransaction(tx.serialize());
    console.log("Transaction sent:", signature);
    
    await connection.confirmTransaction(signature);
    console.log("");
    console.log("✅ Deposit successful!");
    console.log("Amount deposited:", depositAmount, "Test USDC");
    console.log("Transaction:", signature);
    
    // Check new balance
    const newBalance = await connection.getTokenAccountBalance(poolVault);
    console.log("");
    console.log("Pool vault balance:", newBalance.value.uiAmount, "Test USDC");
  } catch (error) {
    console.error("❌ Deposit failed:", error.message);
    if (error.logs) {
      console.log("\nTransaction logs:");
      error.logs.forEach(log => console.log(log));
    }
    process.exit(1);
  }
}

depositToLendingPool();
