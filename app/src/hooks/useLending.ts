import { useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { getLendingProgramId, deriveDepositorPDA, getConnection } from '@/lib/contracts';

export interface LendingPool {
  address: string;
  tokenMint: string;
  totalDeposits: string;
  totalBorrowed: string;
  interestRate: string;
  utilization: string;
  apy: string;
  minDeposit: string;
}

export interface DepositorAccount {
  depositor: string;
  depositedAmount: string;
  depositTimestamp: number;
}

interface SolanaProvider {
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

export function useLending() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana');

  const loadUserDeposits = useCallback(async (
    lendingPoolAddress: string
  ): Promise<DepositorAccount | null> => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return null;
    }

    try {
      const connection = getConnection();
      const depositorPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
      // Derive depositor PDA
      const [depositorPDA] = await deriveDepositorPDA(depositorPubkey, lendingPoolPubkey);
      
      console.log('Loading deposits from PDA:', depositorPDA.toBase58());
      
      // Fetch account data
      const accountInfo = await connection.getAccountInfo(depositorPDA);
      
      if (!accountInfo) {
        console.log('No depositor account found');
        return null;
      }

      // Parse account data (simplified - actual parsing depends on account structure)
      // TODO: Use anchor to properly deserialize the account
      return {
        depositor: address,
        depositedAmount: '0',
        depositTimestamp: Date.now() / 1000,
      };
    } catch (error) {
      console.error('Error loading deposits:', error);
      return null;
    }
  }, [isConnected, address]);

  const deposit = useCallback(async (
    lendingPoolAddress: string,
    amount: number
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const programId = getLendingProgramId();
      const depositorPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
      // Derive depositor PDA
      const [depositorPDA] = await deriveDepositorPDA(depositorPubkey, lendingPoolPubkey);
      
      console.log('Depositing', amount, 'to lending pool:', lendingPoolAddress);
      console.log('Depositor PDA:', depositorPDA.toBase58());
      
      // Build transaction
      const transaction = new Transaction();
      // TODO: Add actual deposit instruction using @coral-xyz/anchor
      // const instruction = await program.methods
      //   .depositIntoLendingPool(new BN(amount * 1e9))
      //   .accounts({
      //     lendingPool: lendingPoolPubkey,
      //     depositorAccount: depositorPDA,
      //     depositor: depositorPubkey,
      //     depositorTokenAccount: userTokenAccount,
      //     poolVault: poolVault,
      //     tokenProgram: TOKEN_PROGRAM_ID,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();
      // transaction.add(instruction);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = depositorPubkey;

      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Deposit successful with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const withdraw = useCallback(async (
    lendingPoolAddress: string,
    amount: number
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const depositorPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
      // Derive depositor PDA
      const [depositorPDA] = await deriveDepositorPDA(depositorPubkey, lendingPoolPubkey);
      
      console.log('Withdrawing', amount, 'from lending pool:', lendingPoolAddress);
      
      const transaction = new Transaction();
      // TODO: Add actual withdraw instruction
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = depositorPubkey;

      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Withdrawal successful with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  return {
    loadUserDeposits,
    deposit,
    withdraw,
  };
}
