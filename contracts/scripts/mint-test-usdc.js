const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function mintTestUsdc() {
  const mintAmount = process.argv[2] ? parseFloat(process.argv[2]) : 10000; // Default 10,000 Test USDC
  
  console.log("🪙 Minting Test USDC");
  console.log("Amount:", mintAmount, "Test USDC");
  console.log("");

  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
    "confirmed"
  );

  // Load wallet
  const walletPath = process.env.ANCHOR_WALLET || 
    path.join(__dirname, "..", "deployer-keypair.json");
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("Recipient:", walletKeypair.publicKey.toString());

  const testUsdcMint = new PublicKey(process.env.TEST_USDC_MINT);
  const testUsdcProgramId = new PublicKey(process.env.TEST_USDC_PROGRAM_ID);
  
  console.log("Test USDC Mint:", testUsdcMint.toString());
  console.log("Test USDC Program:", testUsdcProgramId.toString());
  console.log("");

  // Get recipient's token account
  const recipientTokenAccount = getAssociatedTokenAddressSync(
    testUsdcMint,
    walletKeypair.publicKey
  );

  console.log("Recipient Token Account:", recipientTokenAccount.toString());

  // Check if token account exists
  const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
  const tx = new Transaction();
  
  if (!accountInfo) {
    console.log("Creating associated token account...");
    const createAtaIx = createAssociatedTokenAccountInstruction(
      walletKeypair.publicKey,
      recipientTokenAccount,
      walletKeypair.publicKey,
      testUsdcMint
    );
    tx.add(createAtaIx);
  }

  // Build mint instruction
  const amountLamports = BigInt(Math.floor(mintAmount * 1_000_000)); // 6 decimals
  
  // Discriminator for mint_to instruction from IDL
  const discriminator = Buffer.from([241, 34, 48, 186, 37, 179, 123, 192]);
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amountLamports);
  const data = Buffer.concat([discriminator, amountBuffer]);

  const mintIx = new TransactionInstruction({
    keys: [
      { pubkey: testUsdcMint, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: testUsdcProgramId,
    data,
  });

  tx.add(mintIx);

  // Send transaction
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = walletKeypair.publicKey;
    tx.sign(walletKeypair);

    console.log("Sending transaction...");
    const signature = await connection.sendRawTransaction(tx.serialize());
    console.log("Transaction sent:", signature);
    
    await connection.confirmTransaction(signature);
    console.log("");
    console.log("✅ Mint successful!");
    console.log("Amount minted:", mintAmount, "Test USDC");
    console.log("Transaction:", signature);
    
    // Check new balance
    const newBalance = await connection.getTokenAccountBalance(recipientTokenAccount);
    console.log("");
    console.log("Your Test USDC balance:", newBalance.value.uiAmount, "Test USDC");
  } catch (error) {
    console.error("❌ Mint failed:", error.message);
    if (error.logs) {
      console.log("\nTransaction logs:");
      error.logs.forEach(log => console.log(log));
    }
    process.exit(1);
  }
}

mintTestUsdc();
