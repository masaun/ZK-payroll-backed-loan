import { useCallback } from 'react';
import { 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  VersionedTransaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { 
  getLendingProgramId, 
  deriveDepositorPDA, 
  getConnection,
  getTokenProgramId,
  deriveAssociatedTokenAddress 
} from '@/lib/contracts';
import { TOKEN_MINTS } from '@/config';

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
    amount: number,
    tokenMint?: string
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const programId = getLendingProgramId();
      const depositorPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      const mintPubkey = new PublicKey(tokenMint || TOKEN_MINTS.testUsdc);
      
      // Derive PDAs
      const [depositorPDA] = await deriveDepositorPDA(depositorPubkey, lendingPoolPubkey);
      const [poolVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), lendingPoolPubkey.toBuffer(), mintPubkey.toBuffer()],
        programId
      );
      
      // Get depositor's token account
      const depositorTokenAccount = await deriveAssociatedTokenAddress(
        depositorPubkey,
        mintPubkey
      );
      
      console.log('Depositing', amount, 'Test USDC to lending pool:', lendingPoolAddress);
      console.log('Depositor PDA:', depositorPDA.toBase58());
      console.log('Pool Vault:', poolVault.toBase58());
      console.log('Depositor Token Account:', depositorTokenAccount.toBase58());
      
      // Build deposit instruction
      const amountLamports = Math.floor(amount * 1e6); // 6 decimals for USDC
      
      // Create the instruction data (discriminator + amount)
      const discriminator = Buffer.from([3, 250, 204, 232, 7, 192, 142, 181]); // deposit_into_lending_pool
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(BigInt(amountLamports));
      const data = Buffer.concat([discriminator, amountBuffer]);
      
      const depositInstruction = new TransactionInstruction({
        keys: [
          { pubkey: lendingPoolPubkey, isSigner: false, isWritable: true },
          { pubkey: depositorPDA, isSigner: false, isWritable: true },
          { pubkey: poolVault, isSigner: false, isWritable: true },
          { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
          { pubkey: depositorPubkey, isSigner: true, isWritable: true },
          { pubkey: getTokenProgramId(), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
      });

      const transaction = new Transaction().add(depositInstruction);
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
    amount: number,
    tokenMint?: string
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const programId = getLendingProgramId();
      const depositorPubkey = new PublicKey(address);
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      const mintPubkey = new PublicKey(tokenMint || TOKEN_MINTS.testUsdc);
      
      // Derive PDAs
      const [depositorPDA] = await deriveDepositorPDA(depositorPubkey, lendingPoolPubkey);
      const [poolVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), lendingPoolPubkey.toBuffer(), mintPubkey.toBuffer()],
        programId
      );
      
      // Get depositor's token account
      const depositorTokenAccount = await deriveAssociatedTokenAddress(
        depositorPubkey,
        mintPubkey
      );
      
      console.log('Withdrawing', amount, 'Test USDC from lending pool:', lendingPoolAddress);
      console.log('Depositor PDA:', depositorPDA.toBase58());
      console.log('Pool Vault:', poolVault.toBase58());
      
      // Build withdraw instruction
      const amountLamports = Math.floor(amount * 1e6); // 6 decimals for USDC
      
      // Create the instruction data (discriminator + amount)
      const discriminator = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34]); // withdraw_from_lending_pool
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(BigInt(amountLamports));
      const data = Buffer.concat([discriminator, amountBuffer]);
      
      const withdrawInstruction = new TransactionInstruction({
        keys: [
          { pubkey: lendingPoolPubkey, isSigner: false, isWritable: true },
          { pubkey: depositorPDA, isSigner: false, isWritable: true },
          { pubkey: poolVault, isSigner: false, isWritable: true },
          { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
          { pubkey: depositorPubkey, isSigner: true, isWritable: false },
          { pubkey: getTokenProgramId(), isSigner: false, isWritable: false },
        ],
        programId,
        data,
      });

      const transaction = new Transaction().add(withdrawInstruction);
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
