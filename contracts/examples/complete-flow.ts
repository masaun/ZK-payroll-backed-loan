import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { ZkVerifiableCredentialManager } from "../target/types/zk_verifiable_credential_manager";
import { Lending } from "../target/types/lending";
import { Borrowing } from "../target/types/borrowing";
import { 
  PublicKey, 
  Keypair, 
  Connection, 
  clusterApiUrl,
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount 
} from "@solana/spl-token";

/**
 * Complete example showing the full flow:
 * 1. Store ZK proof
 * 2. Deposit to lending pool
 * 3. Deposit collateral
 * 4. Borrow against collateral
 * 5. Repay loan
 * 6. Withdraw funds
 */

async function main() {
  // Setup connection and provider
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Load wallet from filesystem or create new one
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log("🚀 Starting ZK Payroll Backed Loan Demo");
  console.log("Wallet:", wallet.publicKey.toString());
  console.log("");

  // Airdrop SOL for testing
  console.log("💧 Requesting airdrop...");
  const airdropSig = await connection.requestAirdrop(
    wallet.publicKey,
    5 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);
  console.log("✅ Airdrop received");
  console.log("");

  // Load programs
  const credentialProgram = anchor.workspace.ZkVerifiableCredentialManager as Program<ZkVerifiableCredentialManager>;
  const lendingProgram = anchor.workspace.Lending as Program<Lending>;
  const borrowingProgram = anchor.workspace.Borrowing as Program<Borrowing>;

  // ========================================
  // STEP 1: Store ZK-TLS Proof
  // ========================================
  console.log("📝 STEP 1: Storing ZK-TLS Proof");
  console.log("-----------------------------------");
  
  const proofData = Buffer.from("mock-zk-proof-payroll-data-12345");
  const publicOutput = Buffer.from("verified-salary-100000-usd");
  const proofHash = Array.from(Buffer.alloc(32, 1));

  const [credentialPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("credential"),
      wallet.publicKey.toBuffer(),
      Buffer.from(proofHash),
    ],
    credentialProgram.programId
  );

  try {
    const credentialTx = await credentialProgram.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ ZK proof stored!");
    console.log("Transaction:", credentialTx);
    console.log("Credential PDA:", credentialPDA.toString());

    // Fetch and display credential
    const credential = await credentialProgram.account.zkCredential.fetch(credentialPDA);
    console.log("Proof verified:", credential.isVerified);
    console.log("Timestamp:", new Date(credential.timestamp.toNumber() * 1000).toISOString());
  } catch (error) {
    console.error("❌ Error storing credential:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 2: Setup Token Mints and Pools
  // ========================================
  console.log("🏦 STEP 2: Setting up Token Mints and Pools");
  console.log("-----------------------------------");

  const payer = wallet.payer;
  
  // Create USDC mock token (for lending)
  const usdcMint = await createMint(
    connection,
    payer,
    wallet.publicKey,
    null,
    6 // USDC has 6 decimals
  );
  console.log("✅ USDC Mock Mint:", usdcMint.toString());

  // Create SOL collateral token mock
  const collateralMint = await createMint(
    connection,
    payer,
    wallet.publicKey,
    null,
    9 // SOL has 9 decimals
  );
  console.log("✅ Collateral Mint:", collateralMint.toString());
  console.log("");

  // ========================================
  // STEP 3: Initialize Lending Pool
  // ========================================
  console.log("💰 STEP 3: Initializing Lending Pool");
  console.log("-----------------------------------");

  const [lendingPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), usdcMint.toBuffer()],
    lendingProgram.programId
  );

  const lendingVault = await createAccount(
    connection,
    payer,
    usdcMint,
    lendingPoolPDA
  );

  const INTEREST_RATE = 500; // 5%
  const MIN_DEPOSIT = 1000;

  try {
    const initLendingTx = await lendingProgram.methods
      .initializeLendingPool(
        new anchor.BN(INTEREST_RATE),
        new anchor.BN(MIN_DEPOSIT)
      )
      .accounts({
        lendingPool: lendingPoolPDA,
        tokenMint: usdcMint,
        poolVault: lendingVault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Lending pool initialized!");
    console.log("Transaction:", initLendingTx);
    console.log("Pool PDA:", lendingPoolPDA.toString());
    console.log("Interest Rate:", INTEREST_RATE / 100, "%");
  } catch (error) {
    console.error("❌ Error initializing lending pool:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 4: Deposit to Lending Pool (as Lender)
  // ========================================
  console.log("💵 STEP 4: Depositing to Lending Pool");
  console.log("-----------------------------------");

  // Create user's USDC token account
  const userUsdcAccount = await createAccount(
    connection,
    payer,
    usdcMint,
    wallet.publicKey
  );

  // Mint USDC to user
  const depositAmount = 100000; // 100 USDC
  await mintTo(
    connection,
    payer,
    usdcMint,
    userUsdcAccount,
    wallet.publicKey,
    depositAmount * 10 // Mint extra for operations
  );
  console.log("✅ Minted", depositAmount * 10, "USDC to user");

  const [depositorAccountPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("depositor"),
      wallet.publicKey.toBuffer(),
      lendingPoolPDA.toBuffer(),
    ],
    lendingProgram.programId
  );

  try {
    const depositTx = await lendingProgram.methods
      .depositIntoLendingPool(new anchor.BN(depositAmount))
      .accounts({
        lendingPool: lendingPoolPDA,
        depositorAccount: depositorAccountPDA,
        poolVault: lendingVault,
        depositorTokenAccount: userUsdcAccount,
        depositor: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Deposited", depositAmount, "USDC to lending pool!");
    console.log("Transaction:", depositTx);

    const pool = await lendingProgram.account.lendingPool.fetch(lendingPoolPDA);
    console.log("Total Pool Deposits:", pool.totalDeposits.toString());
  } catch (error) {
    console.error("❌ Error depositing:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 5: Initialize Collateral Pool
  // ========================================
  console.log("🔒 STEP 5: Initializing Collateral Pool");
  console.log("-----------------------------------");

  const [collateralPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("collateral_pool"), collateralMint.toBuffer()],
    borrowingProgram.programId
  );

  const collateralVault = await createAccount(
    connection,
    payer,
    collateralMint,
    collateralPoolPDA
  );

  const COLLATERAL_RATIO = 15000; // 150%
  const LIQUIDATION_THRESHOLD = 12000; // 120%

  try {
    const initCollateralTx = await borrowingProgram.methods
      .initializeCollateralPool(
        new anchor.BN(COLLATERAL_RATIO),
        new anchor.BN(LIQUIDATION_THRESHOLD)
      )
      .accounts({
        collateralPool: collateralPoolPDA,
        collateralMint: collateralMint,
        poolVault: collateralVault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Collateral pool initialized!");
    console.log("Transaction:", initCollateralTx);
    console.log("Collateral Ratio:", COLLATERAL_RATIO / 100, "%");
    console.log("Liquidation Threshold:", LIQUIDATION_THRESHOLD / 100, "%");
  } catch (error) {
    console.error("❌ Error initializing collateral pool:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 6: Deposit Collateral (as Borrower)
  // ========================================
  console.log("💎 STEP 6: Depositing Collateral");
  console.log("-----------------------------------");

  const userCollateralAccount = await createAccount(
    connection,
    payer,
    collateralMint,
    wallet.publicKey
  );

  const collateralAmount = 150000; // 0.15 SOL worth
  await mintTo(
    connection,
    payer,
    collateralMint,
    userCollateralAccount,
    wallet.publicKey,
    collateralAmount
  );
  console.log("✅ Minted", collateralAmount, "collateral tokens");

  const [borrowerStatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("borrower"),
      wallet.publicKey.toBuffer(),
      collateralPoolPDA.toBuffer(),
    ],
    borrowingProgram.programId
  );

  try {
    const depositCollateralTx = await borrowingProgram.methods
      .depositIntoCollateralPool(new anchor.BN(collateralAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        poolVault: collateralVault,
        borrowerCollateralAccount: userCollateralAccount,
        borrower: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Deposited", collateralAmount, "collateral!");
    console.log("Transaction:", depositCollateralTx);

    const borrowerState = await borrowingProgram.account.borrowerState.fetch(borrowerStatePDA);
    console.log("Total Collateral:", borrowerState.collateralAmount.toString());
  } catch (error) {
    console.error("❌ Error depositing collateral:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 7: Borrow from Lending Pool
  // ========================================
  console.log("💸 STEP 7: Borrowing from Lending Pool");
  console.log("-----------------------------------");

  const borrowAmount = 100000; // 100 USDC (requires 150k collateral at 150%)

  try {
    const borrowTx = await borrowingProgram.methods
      .borrowFromLendingPool(new anchor.BN(borrowAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        borrower: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Borrowed", borrowAmount, "USDC!");
    console.log("Transaction:", borrowTx);

    const borrowerState = await borrowingProgram.account.borrowerState.fetch(borrowerStatePDA);
    console.log("Total Borrowed:", borrowerState.borrowedAmount.toString());
    console.log("Collateral:", borrowerState.collateralAmount.toString());
    
    const ratio = (borrowerState.collateralAmount.toNumber() / borrowerState.borrowedAmount.toNumber()) * 100;
    console.log("Current Ratio:", ratio.toFixed(2), "%");
  } catch (error) {
    console.error("❌ Error borrowing:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 8: Repay Loan
  // ========================================
  console.log("💳 STEP 8: Repaying Loan");
  console.log("-----------------------------------");

  const repayAmount = 50000; // Repay 50 USDC

  try {
    const repayTx = await borrowingProgram.methods
      .repayToLendingPool(new anchor.BN(repayAmount))
      .accounts({
        borrowerState: borrowerStatePDA,
        borrowerTokenAccount: userUsdcAccount,
        lendingPoolVault: lendingVault,
        borrower: wallet.publicKey,
        collateralPool: collateralPoolPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ Repaid", repayAmount, "USDC!");
    console.log("Transaction:", repayTx);

    const borrowerState = await borrowingProgram.account.borrowerState.fetch(borrowerStatePDA);
    console.log("Remaining Debt:", borrowerState.borrowedAmount.toString());
  } catch (error) {
    console.error("❌ Error repaying:", error.message);
  }
  console.log("");

  // ========================================
  // STEP 9: Withdraw Collateral
  // ========================================
  console.log("🎁 STEP 9: Withdrawing Collateral");
  console.log("-----------------------------------");

  const withdrawCollateralAmount = 10000;

  try {
    const withdrawTx = await borrowingProgram.methods
      .withdrawFromCollateralPool(new anchor.BN(withdrawCollateralAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        poolVault: collateralVault,
        borrowerCollateralAccount: userCollateralAccount,
        borrower: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ Withdrew", withdrawCollateralAmount, "collateral!");
    console.log("Transaction:", withdrawTx);

    const borrowerState = await borrowingProgram.account.borrowerState.fetch(borrowerStatePDA);
    console.log("Remaining Collateral:", borrowerState.collateralAmount.toString());
  } catch (error) {
    console.error("❌ Error withdrawing collateral:", error.message);
  }
  console.log("");

  console.log("🎉 Demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
