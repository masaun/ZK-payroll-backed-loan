import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Borrowing } from "../target/types/borrowing";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("Borrowing with Collateral", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Borrowing as Program<Borrowing>;
  
  let authority: Keypair;
  let borrower: Keypair;
  let liquidator: Keypair;
  let collateralMint: PublicKey;
  let loanMint: PublicKey;
  let poolVault: PublicKey;
  let lendingPoolVault: PublicKey;
  let collateralPoolPDA: PublicKey;
  let borrowerStatePDA: PublicKey;
  let borrowerCollateralAccount: PublicKey;
  let borrowerLoanAccount: PublicKey;
  let liquidatorCollateralAccount: PublicKey;
  let liquidatorLoanAccount: PublicKey;

  const COLLATERAL_RATIO = 15000; // 150%
  const LIQUIDATION_THRESHOLD = 12000; // 120%

  before(async () => {
    authority = Keypair.generate();
    borrower = Keypair.generate();
    liquidator = Keypair.generate();

    // Airdrop SOL
    for (const keypair of [authority, borrower, liquidator]) {
      const signature = await provider.connection.requestAirdrop(
        keypair.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    }

    // Create collateral and loan token mints
    collateralMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    loanMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    // Derive collateral pool PDA
    [collateralPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("collateral_pool"), collateralMint.toBuffer()],
      program.programId
    );

    // Create pool vault
    poolVault = await createAccount(
      provider.connection,
      authority,
      collateralMint,
      collateralPoolPDA
    );

    // Create lending pool vault (mock)
    lendingPoolVault = await createAccount(
      provider.connection,
      authority,
      loanMint,
      authority.publicKey
    );

    // Mint initial tokens to lending pool
    await mintTo(
      provider.connection,
      authority,
      loanMint,
      lendingPoolVault,
      authority,
      10000000
    );

    // Create borrower accounts
    borrowerCollateralAccount = await createAccount(
      provider.connection,
      borrower,
      collateralMint,
      borrower.publicKey
    );

    borrowerLoanAccount = await createAccount(
      provider.connection,
      borrower,
      loanMint,
      borrower.publicKey
    );

    // Mint collateral to borrower
    await mintTo(
      provider.connection,
      authority,
      collateralMint,
      borrowerCollateralAccount,
      authority,
      1000000
    );

    // Create liquidator accounts
    liquidatorCollateralAccount = await createAccount(
      provider.connection,
      liquidator,
      collateralMint,
      liquidator.publicKey
    );

    liquidatorLoanAccount = await createAccount(
      provider.connection,
      liquidator,
      loanMint,
      liquidator.publicKey
    );

    // Mint loan tokens to liquidator
    await mintTo(
      provider.connection,
      authority,
      loanMint,
      liquidatorLoanAccount,
      authority,
      1000000
    );

    // Derive borrower state PDA
    [borrowerStatePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("borrower"),
        borrower.publicKey.toBuffer(),
        collateralPoolPDA.toBuffer(),
      ],
      program.programId
    );
  });

  it("Initializes a collateral pool", async () => {
    const tx = await program.methods
      .initializeCollateralPool(
        new anchor.BN(COLLATERAL_RATIO),
        new anchor.BN(LIQUIDATION_THRESHOLD)
      )
      .accounts({
        collateralPool: collateralPoolPDA,
        collateralMint: collateralMint,
        poolVault: poolVault,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize collateral pool transaction:", tx);

    const pool = await program.account.collateralPool.fetch(collateralPoolPDA);
    expect(pool.authority.toString()).to.equal(authority.publicKey.toString());
    expect(pool.collateralMint.toString()).to.equal(collateralMint.toString());
    expect(pool.collateralRatio.toNumber()).to.equal(COLLATERAL_RATIO);
    expect(pool.liquidationThreshold.toNumber()).to.equal(LIQUIDATION_THRESHOLD);
    expect(pool.totalCollateral.toNumber()).to.equal(0);
  });

  it("Deposits collateral into pool", async () => {
    const collateralAmount = 150000;

    const tx = await program.methods
      .depositIntoCollateralPool(new anchor.BN(collateralAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        poolVault: poolVault,
        borrowerCollateralAccount: borrowerCollateralAccount,
        borrower: borrower.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    console.log("Deposit collateral transaction:", tx);

    const borrowerState = await program.account.borrowerState.fetch(borrowerStatePDA);
    expect(borrowerState.borrower.toString()).to.equal(borrower.publicKey.toString());
    expect(borrowerState.collateralAmount.toNumber()).to.equal(collateralAmount);

    const pool = await program.account.collateralPool.fetch(collateralPoolPDA);
    expect(pool.totalCollateral.toNumber()).to.equal(collateralAmount);
  });

  it("Borrows from lending pool with sufficient collateral", async () => {
    const borrowAmount = 100000; // Requires 150,000 collateral at 150% ratio

    const tx = await program.methods
      .borrowFromLendingPool(new anchor.BN(borrowAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        borrower: borrower.publicKey,
      })
      .signers([borrower])
      .rpc();

    console.log("Borrow transaction:", tx);

    const borrowerState = await program.account.borrowerState.fetch(borrowerStatePDA);
    expect(borrowerState.borrowedAmount.toNumber()).to.equal(borrowAmount);
  });

  it("Fails to borrow with insufficient collateral", async () => {
    const excessiveBorrowAmount = 200000; // Would require 300,000 collateral

    try {
      await program.methods
        .borrowFromLendingPool(new anchor.BN(excessiveBorrowAmount))
        .accounts({
          collateralPool: collateralPoolPDA,
          borrowerState: borrowerStatePDA,
          borrower: borrower.publicKey,
        })
        .signers([borrower])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("InsufficientCollateral");
    }
  });

  it("Repays loan to lending pool", async () => {
    const repayAmount = 50000;

    const borrowerStateBefore = await program.account.borrowerState.fetch(borrowerStatePDA);
    const initialDebt = borrowerStateBefore.borrowedAmount.toNumber();

    const tx = await program.methods
      .repayToLendingPool(new anchor.BN(repayAmount))
      .accounts({
        borrowerState: borrowerStatePDA,
        borrowerTokenAccount: borrowerLoanAccount,
        lendingPoolVault: lendingPoolVault,
        borrower: borrower.publicKey,
        collateralPool: collateralPoolPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([borrower])
      .rpc();

    console.log("Repay transaction:", tx);

    const borrowerState = await program.account.borrowerState.fetch(borrowerStatePDA);
    expect(borrowerState.borrowedAmount.toNumber()).to.equal(initialDebt - repayAmount);
  });

  it("Withdraws collateral when properly collateralized", async () => {
    const withdrawAmount = 10000;

    const borrowerStateBefore = await program.account.borrowerState.fetch(borrowerStatePDA);
    const initialCollateral = borrowerStateBefore.collateralAmount.toNumber();

    const tx = await program.methods
      .withdrawFromCollateralPool(new anchor.BN(withdrawAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        poolVault: poolVault,
        borrowerCollateralAccount: borrowerCollateralAccount,
        borrower: borrower.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([borrower])
      .rpc();

    console.log("Withdraw collateral transaction:", tx);

    const borrowerState = await program.account.borrowerState.fetch(borrowerStatePDA);
    expect(borrowerState.collateralAmount.toNumber()).to.equal(initialCollateral - withdrawAmount);
  });

  it("Fails to withdraw collateral that would break collateralization", async () => {
    const borrowerState = await program.account.borrowerState.fetch(borrowerStatePDA);
    const excessiveWithdraw = borrowerState.collateralAmount.toNumber() - 10000; // Leave insufficient collateral

    try {
      await program.methods
        .withdrawFromCollateralPool(new anchor.BN(excessiveWithdraw))
        .accounts({
          collateralPool: collateralPoolPDA,
          borrowerState: borrowerStatePDA,
          poolVault: poolVault,
          borrowerCollateralAccount: borrowerCollateralAccount,
          borrower: borrower.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([borrower])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("InsufficientCollateralAfterWithdrawal");
    }
  });

  it("Emits events on collateral deposit", async () => {
    const collateralAmount = 5000;

    const listener = program.addEventListener("CollateralDeposited", (event) => {
      expect(event.borrower.toString()).to.equal(borrower.publicKey.toString());
      expect(event.amount.toNumber()).to.equal(collateralAmount);
    });

    await program.methods
      .depositIntoCollateralPool(new anchor.BN(collateralAmount))
      .accounts({
        collateralPool: collateralPoolPDA,
        borrowerState: borrowerStatePDA,
        poolVault: poolVault,
        borrowerCollateralAccount: borrowerCollateralAccount,
        borrower: borrower.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    await program.removeEventListener(listener);
  });
});
