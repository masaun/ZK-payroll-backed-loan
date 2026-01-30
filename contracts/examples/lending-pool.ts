import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lending } from "../target/types/lending";
import { PublicKey, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";

/**
 * Example: Interacting with the Lending Pool
 */

async function createLendingPool() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const authority = Keypair.generate();
  const wallet = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.Lending as Program<Lending>;

  // Airdrop SOL
  const airdropSig = await connection.requestAirdrop(
    authority.publicKey,
    5 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);

  // Create a token mint (USDC mock)
  const tokenMint = await createMint(
    connection,
    authority,
    authority.publicKey,
    null,
    6 // USDC decimals
  );

  console.log("Token Mint:", tokenMint.toString());

  // Derive lending pool PDA
  const [lendingPoolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("lending_pool"), tokenMint.toBuffer()],
    program.programId
  );

  // Create pool vault
  const poolVault = await createAccount(
    connection,
    authority,
    tokenMint,
    lendingPoolPDA
  );

  console.log("Pool Vault:", poolVault.toString());
  console.log("Lending Pool PDA:", lendingPoolPDA.toString());

  // Initialize lending pool
  const INTEREST_RATE = 500; // 5%
  const MIN_DEPOSIT = 1000000; // 1 USDC

  console.log("\nInitializing lending pool...");
  const tx = await program.methods
    .initializeLendingPool(
      new anchor.BN(INTEREST_RATE),
      new anchor.BN(MIN_DEPOSIT)
    )
    .accounts({
      lendingPool: lendingPoolPDA,
      tokenMint: tokenMint,
      poolVault: poolVault,
      authority: authority.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Lending pool created!");
  console.log("Transaction:", tx);

  const pool = await program.account.lendingPool.fetch(lendingPoolPDA);
  console.log("\nPool Details:");
  console.log("Authority:", pool.authority.toString());
  console.log("Interest Rate:", pool.interestRate.toNumber() / 100, "%");
  console.log("Min Deposit:", pool.minDeposit.toString());
  console.log("Total Deposits:", pool.totalDeposits.toString());

  return {
    tokenMint,
    poolVault,
    lendingPoolPDA,
    authority,
  };
}

async function depositToPool(
  tokenMint: PublicKey,
  poolVault: PublicKey,
  lendingPoolPDA: PublicKey,
  authority: Keypair,
  amount: number
) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.Lending as Program<Lending>;

  // Create depositor's token account
  const depositorTokenAccount = await createAccount(
    connection,
    authority,
    tokenMint,
    authority.publicKey
  );

  // Mint tokens to depositor
  await mintTo(
    connection,
    authority,
    tokenMint,
    depositorTokenAccount,
    authority,
    amount * 2 // Mint double for safety
  );

  console.log(`\nMinted ${amount} tokens to depositor`);

  // Derive depositor account PDA
  const [depositorAccountPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("depositor"),
      authority.publicKey.toBuffer(),
      lendingPoolPDA.toBuffer(),
    ],
    program.programId
  );

  console.log(`Depositing ${amount} tokens to lending pool...`);

  const tx = await program.methods
    .depositIntoLendingPool(new anchor.BN(amount))
    .accounts({
      lendingPool: lendingPoolPDA,
      depositorAccount: depositorAccountPDA,
      poolVault: poolVault,
      depositorTokenAccount: depositorTokenAccount,
      depositor: authority.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Deposit successful!");
  console.log("Transaction:", tx);

  const pool = await program.account.lendingPool.fetch(lendingPoolPDA);
  console.log("Pool Total Deposits:", pool.totalDeposits.toString());

  const depositorAccount = await program.account.depositorAccount.fetch(depositorAccountPDA);
  console.log("Your Deposited Amount:", depositorAccount.depositedAmount.toString());
}

async function withdrawFromPool(
  poolVault: PublicKey,
  lendingPoolPDA: PublicKey,
  depositorTokenAccount: PublicKey,
  authority: Keypair,
  amount: number
) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.Lending as Program<Lending>;

  const [depositorAccountPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("depositor"),
      authority.publicKey.toBuffer(),
      lendingPoolPDA.toBuffer(),
    ],
    program.programId
  );

  console.log(`\nWithdrawing ${amount} tokens from lending pool...`);

  const tx = await program.methods
    .withdrawFromLendingPool(new anchor.BN(amount))
    .accounts({
      lendingPool: lendingPoolPDA,
      depositorAccount: depositorAccountPDA,
      poolVault: poolVault,
      depositorTokenAccount: depositorTokenAccount,
      depositor: authority.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✅ Withdrawal successful!");
  console.log("Transaction:", tx);

  const depositorAccount = await program.account.depositorAccount.fetch(depositorAccountPDA);
  console.log("Remaining Deposited Amount:", depositorAccount.depositedAmount.toString());
}

async function main() {
  console.log("=== Lending Pool Example ===\n");

  const { tokenMint, poolVault, lendingPoolPDA, authority } = await createLendingPool();

  await new Promise(resolve => setTimeout(resolve, 2000));

  await depositToPool(tokenMint, poolVault, lendingPoolPDA, authority, 100000000); // 100 USDC

  console.log("\n=== Example completed ===");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createLendingPool, depositToPool, withdrawFromPool };
