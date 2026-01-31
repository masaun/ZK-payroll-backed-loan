import { useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { getBorrowingProgramId, deriveBorrowerPDA, getConnection } from '@/lib/contracts';

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
    collateralPoolAddress: string
  ): Promise<BorrowerState | null> => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return null;
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const collateralPoolPubkey = new PublicKey(collateralPoolAddress);
      
      // Derive borrower PDA
      const [borrowerPDA] = await deriveBorrowerPDA(borrowerPubkey, collateralPoolPubkey);
      
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
    collateralPoolAddress: string,
    lendingPoolAddress: string,
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
      
      // Check if borrower account exists (user must deposit collateral first)
      try {
        const borrowerAccount = await connection.getAccountInfo(borrowerPDA);
        if (!borrowerAccount) {
          throw new Error(
            'You must deposit collateral before borrowing. ' +
            'Please deposit collateral first to initialize your borrower account.'
          );
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('deposit collateral')) {
          throw err;
        }
        throw new Error(
          'Failed to check borrower account. ' +
          'Please ensure you have deposited collateral before borrowing.'
        );
      }
      
      console.log('Borrowing', amount, 'from lending pool:', lendingPoolAddress);
      console.log('Borrower PDA:', borrowerPDA.toString());
      console.log('Collateral Pool:', collateralPoolPubkey.toString());
      
      // For now, return a mock transaction since the contract integration is TODO
      // This prevents the \"empty transaction\" error
      throw new Error(
        'Borrow functionality is not yet implemented. ' +
        'The ZK proof generation works, but contract integration is pending. ' +
        'Please check the contract deployment status and ensure all programs are deployed.'
      );
      
      // TODO: Uncomment when contract is fully deployed and tested
      // const program = getProgram(PROGRAM_IDS.borrowing);
      // const instruction = await program.methods
      //   .borrowFromLendingPool(new BN(amount * 1e9))
      //   .accounts({
      //     collateralPool: collateralPoolPubkey,
      //     borrowerState: borrowerPDA,
      //     borrower: borrowerPubkey,
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
      // console.log('Borrow successful with signature:', signature);
      // return signature;
    } catch (error) {
      console.error('Error borrowing:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const repay = useCallback(async (
    collateralPoolAddress: string,
    lendingPoolAddress: string,
    amount: number
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const borrowerPubkey = new PublicKey(address);
      const collateralPoolPubkey = new PublicKey(collateralPoolAddress);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
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
