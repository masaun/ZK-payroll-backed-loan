import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lending } from "../target/types/lending";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("Lending Pool", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Lending as Program<Lending>;
  
  let authority: Keypair;
  let depositor: Keypair;
  let tokenMint: PublicKey;
  let poolVault: PublicKey;
  let lendingPoolPDA: PublicKey;
  let depositorTokenAccount: PublicKey;
  let depositorAccountPDA: PublicKey;

  const INTEREST_RATE = 500; // 5%
  const MIN_DEPOSIT = 1000;

  before(async () => {
    authority = Keypair.generate();
    depositor = Keypair.generate();

    // Airdrop SOL
    for (const keypair of [authority, depositor]) {
      const signature = await provider.connection.requestAirdrop(
        keypair.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    }

    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    // Derive PDAs
    [lendingPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("lending_pool"), tokenMint.toBuffer()],
      program.programId
    );

    // Create pool vault
    poolVault = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      lendingPoolPDA
    );

    // Create depositor token account and mint tokens
    depositorTokenAccount = await createAccount(
      provider.connection,
      depositor,
      tokenMint,
      depositor.publicKey
    );

    await mintTo(
      provider.connection,
      authority,
      tokenMint,
      depositorTokenAccount,
      authority,
      1000000
    );

    // Derive depositor account PDA
    [depositorAccountPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("depositor"),
        depositor.publicKey.toBuffer(),
        lendingPoolPDA.toBuffer(),
      ],
      program.programId
    );
  });

  it("Initializes a lending pool", async () => {
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
      .signers([authority])
      .rpc();

    console.log("Initialize pool transaction:", tx);

    const pool = await program.account.lendingPool.fetch(lendingPoolPDA);
    expect(pool.authority.toString()).to.equal(authority.publicKey.toString());
    expect(pool.tokenMint.toString()).to.equal(tokenMint.toString());
    expect(pool.interestRate.toNumber()).to.equal(INTEREST_RATE);
    expect(pool.minDeposit.toNumber()).to.equal(MIN_DEPOSIT);
    expect(pool.totalDeposits.toNumber()).to.equal(0);
    expect(pool.totalBorrowed.toNumber()).to.equal(0);
  });

  it("Deposits tokens into lending pool", async () => {
    const depositAmount = 10000;

    const tx = await program.methods
      .depositIntoLendingPool(new anchor.BN(depositAmount))
      .accounts({
        lendingPool: lendingPoolPDA,
        depositorAccount: depositorAccountPDA,
        poolVault: poolVault,
        depositorTokenAccount: depositorTokenAccount,
        depositor: depositor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([depositor])
      .rpc();

    console.log("Deposit transaction:", tx);

    // Verify pool state
    const pool = await program.account.lendingPool.fetch(lendingPoolPDA);
    expect(pool.totalDeposits.toNumber()).to.equal(depositAmount);

    // Verify depositor account
    const depositorAccount = await program.account.depositorAccount.fetch(depositorAccountPDA);
    expect(depositorAccount.depositor.toString()).to.equal(depositor.publicKey.toString());
    expect(depositorAccount.depositedAmount.toNumber()).to.equal(depositAmount);

    // Verify token transfer
    const vaultAccount = await getAccount(provider.connection, poolVault);
    expect(Number(vaultAccount.amount)).to.equal(depositAmount);
  });

  it("Withdraws tokens from lending pool", async () => {
    const withdrawAmount = 5000;

    const depositorAccountBefore = await program.account.depositorAccount.fetch(depositorAccountPDA);
    const initialDeposit = depositorAccountBefore.depositedAmount.toNumber();

    const tx = await program.methods
      .withdrawFromLendingPool(new anchor.BN(withdrawAmount))
      .accounts({
        lendingPool: lendingPoolPDA,
        depositorAccount: depositorAccountPDA,
        poolVault: poolVault,
        depositorTokenAccount: depositorTokenAccount,
        depositor: depositor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    console.log("Withdrawal transaction:", tx);

    // Verify depositor account
    const depositorAccount = await program.account.depositorAccount.fetch(depositorAccountPDA);
    expect(depositorAccount.depositedAmount.toNumber()).to.equal(initialDeposit - withdrawAmount);

    // Verify pool state
    const pool = await program.account.lendingPool.fetch(lendingPoolPDA);
    expect(pool.totalDeposits.toNumber()).to.equal(initialDeposit - withdrawAmount);
  });

  it("Fails to deposit below minimum", async () => {
    const tooSmallDeposit = MIN_DEPOSIT - 1;

    try {
      await program.methods
        .depositIntoLendingPool(new anchor.BN(tooSmallDeposit))
        .accounts({
          lendingPool: lendingPoolPDA,
          depositorAccount: depositorAccountPDA,
          poolVault: poolVault,
          depositorTokenAccount: depositorTokenAccount,
          depositor: depositor.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([depositor])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("DepositTooSmall");
    }
  });

  it("Fails to withdraw more than deposited", async () => {
    const depositorAccount = await program.account.depositorAccount.fetch(depositorAccountPDA);
    const excessiveWithdraw = depositorAccount.depositedAmount.toNumber() + 1000;

    try {
      await program.methods
        .withdrawFromLendingPool(new anchor.BN(excessiveWithdraw))
        .accounts({
          lendingPool: lendingPoolPDA,
          depositorAccount: depositorAccountPDA,
          poolVault: poolVault,
          depositorTokenAccount: depositorTokenAccount,
          depositor: depositor.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("InsufficientDeposit");
    }
  });

  it("Emits event on deposit", async () => {
    const depositAmount = 2000;

    const listener = program.addEventListener("DepositMade", (event) => {
      expect(event.depositor.toString()).to.equal(depositor.publicKey.toString());
      expect(event.amount.toNumber()).to.equal(depositAmount);
    });

    await program.methods
      .depositIntoLendingPool(new anchor.BN(depositAmount))
      .accounts({
        lendingPool: lendingPoolPDA,
        depositorAccount: depositorAccountPDA,
        poolVault: poolVault,
        depositorTokenAccount: depositorTokenAccount,
        depositor: depositor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([depositor])
      .rpc();

    await program.removeEventListener(listener);
  });
});
