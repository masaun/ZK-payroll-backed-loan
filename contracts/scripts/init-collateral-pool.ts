import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

/**
 * Initialize the collateral pool for Test USDC
 * This script must be run before users can borrow
 */

async function main() {
  // Set up provider and connection
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the borrowing program
  const borrowingIdlPath = path.join(__dirname, '../target/idl/borrowing.json');
  const borrowingIdl = JSON.parse(fs.readFileSync(borrowingIdlPath, 'utf8'));
  const borrowingProgramId = new PublicKey(borrowingIdl.metadata.address);
  const borrowingProgram = new Program(borrowingIdl, borrowingProgramId, provider);

  console.log('Borrowing Program ID:', borrowingProgramId.toBase58());
  console.log('Authority:', provider.wallet.publicKey.toBase58());

  // Test USDC mint address (from deployment)
  const testUsdcMintStr = process.env.TEST_USDC_MINT || '';
  if (!testUsdcMintStr) {
    throw new Error('TEST_USDC_MINT environment variable not set. Please deploy Test USDC first.');
  }
  const testUsdcMint = new PublicKey(testUsdcMintStr);
  console.log('Test USDC Mint:', testUsdcMint.toBase58());

  // Derive collateral pool PDA
  const [collateralPoolPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('collateral_pool'), testUsdcMint.toBuffer()],
    borrowingProgramId
  );
  console.log('Collateral Pool PDA:', collateralPoolPda.toBase58());
  console.log('Bump:', bump);

  // Get or create associated token account for the pool
  const poolVault = await getAssociatedTokenAddress(
    testUsdcMint,
    collateralPoolPda,
    true // allowOwnerOffCurve = true for PDA
  );
  console.log('Pool Vault (ATA):', poolVault.toBase58());

  // Check if pool already exists
  try {
    const poolAccount = await borrowingProgram.account.collateralPool.fetch(collateralPoolPda);
    console.log('\n✓ Collateral pool already initialized!');
    console.log('Pool details:', {
      collateralMint: poolAccount.collateralMint.toBase58(),
      totalCollateral: poolAccount.totalCollateral.toString(),
      collateralRatio: poolAccount.collateralRatio.toString(),
      liquidationThreshold: poolAccount.liquidationThreshold.toString(),
      borrowApy: poolAccount.borrowApy.toString(),
    });
    return;
  } catch (error) {
    console.log('\nCollateral pool not found, initializing...');
  }

  // Initialize collateral pool
  const collateralRatio = 150; // 150% collateralization ratio
  const liquidationThreshold = 120; // 120% liquidation threshold
  const borrowApy = 500; // 5% APY (in basis points)

  try {
    const tx = await borrowingProgram.methods
      .initializeCollateralPool(
        new BN(collateralRatio),
        new BN(liquidationThreshold),
        new BN(borrowApy)
      )
      .accounts({
        collateralPool: collateralPoolPda,
        collateralMint: testUsdcMint,
        poolVault: poolVault,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('\n✓ Collateral pool initialized successfully!');
    console.log('Transaction signature:', tx);
    console.log('\nPool Configuration:');
    console.log('- Collateral Ratio:', collateralRatio + '%');
    console.log('- Liquidation Threshold:', liquidationThreshold + '%');
    console.log('- Borrow APY:', (borrowApy / 100).toFixed(2) + '%');
    console.log('\nPool Addresses:');
    console.log('- Collateral Pool PDA:', collateralPoolPda.toBase58());
    console.log('- Pool Vault:', poolVault.toBase58());
  } catch (error) {
    console.error('Error initializing collateral pool:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
