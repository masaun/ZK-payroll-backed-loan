import { useCallback } from 'react';
import { 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  VersionedTransaction,
  TransactionInstruction 
} from '@solana/web3.js';
import { 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { 
  getBorrowingProgramId,
  getLendingProgramId, 
  deriveBorrowerPDA,
  deriveCollateralPoolPDA,
  getConnection,
  getTokenProgramId,
  deriveAssociatedTokenAddress 
} from '@/lib/contracts';
import { TOKEN_MINTS } from '@/config';

export interface CollateralPool {
  address: string;
  collateralMint: string;
  totalCollateral: string;
  collateralRatio: string;
  liquidationThreshold: string;
  borrowAPY: string;
}

export interface BorrowerState {
  borrower: string;
  collateralAmount: string;
  borrowedAmount: string;
  collateralTimestamp: number;
  borrowTimestamp: number;
}

interface SolanaProvider {
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

export function useBorrowing() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana');

  const loadBorrowerState = useCallback(async (
    lendingPoolAddress: string
  ): Promise<BorrowerState | null> => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return null;
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
      // Derive borrower PDA using lending pool
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, lendingPoolPubkey);
      
      console.log('Loading borrower state from PDA:', borrowerPDA.toBase58());
      
      // Fetch account data
      const accountInfo = await connection.getAccountInfo(borrowerPDA);
      
      if (!accountInfo) {
        console.log('No borrower account found');
        return null;
      }

      // Parse account data (simplified - actual parsing depends on account structure)
      // TODO: Use anchor to properly deserialize the account
      return {
        borrower: address,
        collateralAmount: '0',
        borrowedAmount: '0',
        collateralTimestamp: Date.now() / 1000,
        borrowTimestamp: Date.now() / 1000,
      };
    } catch (error) {
      console.error('Error loading borrower state:', error);
      return null;
    }
  }, [isConnected, address]);

  const depositCollateral = useCallback(async (
    collateralPoolAddress: string,
    amount: number
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const collateralPoolPubkey = new PublicKey(collateralPoolAddress);
      
      // Derive borrower PDA
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, collateralPoolPubkey);
      
      console.log('Depositing', amount, 'collateral to pool:', collateralPoolAddress);
      console.log('Borrower PDA:', borrowerPDA.toBase58());
      console.log('Collateral Pool:', collateralPoolPubkey.toBase58());
      
      // Contract integration not yet implemented
      throw new Error(
        'Deposit collateral functionality is not yet implemented. ' +
        'The smart contracts need to be deployed and integrated. ' +
        'Please ensure the borrowing program is deployed on Solana devnet/mainnet first.'
      );
      
      // TODO: Uncomment when contract is fully deployed and tested
      // const program = getProgram(PROGRAM_IDS.borrowing);
      // const instruction = await program.methods
      //   .depositIntoCollateralPool(new BN(amount * 1e9))
      //   .accounts({
      //     collateralPool: collateralPoolPubkey,
      //     borrowerState: borrowerPDA,
      //     poolVault: poolVault,
      //     borrowerCollateralAccount: userCollateralAccount,
      //     borrower: borrowerPubkey,
      //     tokenProgram: TOKEN_PROGRAM_ID,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();
      //
      // const transaction = new Transaction();
      // transaction.add(instruction);
      //
      // const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      // transaction.recentBlockhash = blockhash;
      // transaction.feePayer = borrowerPubkey;
      //
      // const provider = walletProvider as unknown as SolanaProvider;
      // const signedTx = await provider.signTransaction(transaction);
      // const signature = await connection.sendRawTransaction(signedTx.serialize());
      // await connection.confirmTransaction({
      //   signature,
      //   blockhash,
      //   lastValidBlockHeight
      // });
      //
      // console.log('Collateral deposit successful with signature:', signature);
      // return signature;
    } catch (error) {
      console.error('Error depositing collateral:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const borrow = useCallback(async (
    lendingPoolAddress: string,
    amount: number,
    tokenMint?: string
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const borrowingProgramId = getBorrowingProgramId();
      const lendingProgramId = getLendingProgramId();
      const borrowerPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      const mintPubkey = new PublicKey(tokenMint || TOKEN_MINTS.testUsdc);
      
      // Derive borrower PDA - now uses lending pool instead of collateral pool
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, lendingPoolPubkey);
      
      // Pool vault is the associated token account for the lending pool PDA
      const poolVault = await deriveAssociatedTokenAddress(
        lendingPoolPubkey,
        mintPubkey
      );
      
      // Get borrower's token account
      const borrowerTokenAccount = await deriveAssociatedTokenAddress(
        borrowerPubkey,
        mintPubkey
      );
      
      console.log('Borrowing', amount, 'Test USDC from lending pool:', lendingPoolAddress);
      console.log('Borrower PDA:', borrowerPDA.toString());
      console.log('Lending Pool:', lendingPoolPubkey.toString());
      console.log('Pool Vault:', poolVault.toBase58());
      console.log('Borrower Token Account:', borrowerTokenAccount.toBase58());
      
      // Check if borrower's token account exists, create if not
      const borrowerTokenAccountInfo = await connection.getAccountInfo(borrowerTokenAccount);
      const transaction = new Transaction();
      
      if (!borrowerTokenAccountInfo) {
        console.log('Creating borrower token account...');
        const createAtaIx = createAssociatedTokenAccountInstruction(
          borrowerPubkey, // payer
          borrowerTokenAccount, // ata
          borrowerPubkey, // owner
          mintPubkey, // mint
          getTokenProgramId(),
          new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
        );
        transaction.add(createAtaIx);
      }
      
      // Build borrow instruction
      const amountLamports = Math.floor(amount * 1e6); // 6 decimals for USDC
      
      // Discriminator for borrow_from_lending_pool instruction
      const discriminator = Buffer.from([99, 60, 94, 213, 230, 176, 124, 233]); // borrow_from_lending_pool
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(BigInt(amountLamports));
      const data = Buffer.concat([discriminator, amountBuffer]);
      
      // The borrow_from_lending_pool function accounts:
      // 1. lending_pool (mut)
      // 2. pool_vault (mut)
      // 3. borrower_token_account (mut)
      // 4. borrower_state (mut, PDA, init_if_needed)
      // 5. borrower (mut, signer)
      // 6. lending_program (for CPI)
      // 7. token_program
      // 8. system_program
      const borrowInstruction = new TransactionInstruction({
        keys: [
          { pubkey: lendingPoolPubkey, isSigner: false, isWritable: true },
          { pubkey: poolVault, isSigner: false, isWritable: true },
          { pubkey: borrowerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: borrowerPDA, isSigner: false, isWritable: true },
          { pubkey: borrowerPubkey, isSigner: true, isWritable: true },
          { pubkey: lendingProgramId, isSigner: false, isWritable: false },
          { pubkey: getTokenProgramId(), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: borrowingProgramId,
        data,
      });

      transaction.add(borrowInstruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = borrowerPubkey;

      console.log('Transaction prepared, signing...');
      
      if (!walletProvider) {
        throw new Error('Wallet provider not available');
      }

      const provider = walletProvider as unknown as SolanaProvider;
      
      let signedTx;
      try {
        signedTx = await provider.signTransaction(transaction);
      } catch (signError) {
        console.error('Error signing transaction:', signError);
        const errorMessage = signError instanceof Error ? signError.message : 'Please ensure your wallet is unlocked and connected';
        throw new Error(`Failed to sign transaction: ${errorMessage}`);
      }
      
      console.log('Transaction signed, sending...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Transaction sent, confirming...');
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Borrow successful with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error borrowing:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const repay = useCallback(async (
    lendingPoolAddress: string,
    amount: number,
    tokenMint?: string
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      const mintPubkey = new PublicKey(tokenMint || TOKEN_MINTS.testUsdc);
      
      // Derive collateral pool PDA from the mint
      const [collateralPoolPubkey] = await deriveCollateralPoolPDA(mintPubkey);
      
      // Derive borrower PDA
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, collateralPoolPubkey);
      
      console.log('Repaying', amount, 'to lending pool:', lendingPoolAddress);
      
      const transaction = new Transaction();
      // TODO: Add actual repay instruction
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = borrowerPubkey;

      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Repayment successful with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error repaying:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const withdrawCollateral = useCallback(async (
    collateralPoolAddress: string,
    amount: number
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const collateralPoolPubkey = new PublicKey(collateralPoolAddress);
      
      // Derive borrower PDA
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, collateralPoolPubkey);
      
      console.log('Withdrawing', amount, 'collateral from pool:', collateralPoolAddress);
      
      const transaction = new Transaction();
      // TODO: Add actual withdraw collateral instruction
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = borrowerPubkey;

      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Collateral withdrawal successful with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  return {
    loadBorrowerState,
    depositCollateral,
    borrow,
    repay,
    withdrawCollateral,
  };
}
