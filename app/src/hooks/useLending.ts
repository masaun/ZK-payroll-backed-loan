import { useCallback } from 'react';
import { 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  VersionedTransaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
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

      // Parse account data
      // DepositorAccount structure:
      // - depositor: Pubkey (32 bytes)
      // - lending_pool: Pubkey (32 bytes)
      // - deposited_amount: u64 (8 bytes)
      // - deposit_timestamp: i64 (8 bytes)
      const data = accountInfo.data;
      
      if (data.length < 8 + 32 + 32 + 8 + 8) {
        console.error('Invalid account data length');
        return null;
      }
      
      // Skip 8-byte discriminator
      let offset = 8;
      
      // Read deposited_amount (u64 at offset 64)
      offset = 8 + 32 + 32; // discriminator + depositor + lending_pool
      const depositedAmount = data.readBigUInt64LE(offset);
      
      // Read deposit_timestamp (i64)
      offset += 8;
      const depositTimestamp = Number(data.readBigInt64LE(offset));
      
      console.log('Deposited amount (raw):', depositedAmount.toString());
      console.log('Deposit timestamp:', depositTimestamp);

      return {
        depositor: address,
        depositedAmount: depositedAmount.toString(),
        depositTimestamp: depositTimestamp,
      };
    } catch (error) {
      console.error('Error loading deposits:', error);
      return null;
    }
  }, [isConnected, address]);

  const loadPoolData = useCallback(async (
    lendingPoolAddress: string
  ): Promise<LendingPool | null> => {
    try {
      const connection = getConnection();
      const lendingPoolPubkey = new PublicKey(lendingPoolAddress);
      
      console.log('Loading pool data from:', lendingPoolAddress);
      
      // Fetch pool account data
      const accountInfo = await connection.getAccountInfo(lendingPoolPubkey);
      
      if (!accountInfo) {
        console.log('Pool account not found');
        return null;
      }

      // Parse LendingPool account data
      // LendingPool structure:
      // - authority: Pubkey (32 bytes)
      // - token_mint: Pubkey (32 bytes)
      // - pool_vault: Pubkey (32 bytes)
      // - total_deposits: u64 (8 bytes)
      // - total_borrowed: u64 (8 bytes)
      // - interest_rate: u64 (8 bytes)
      // - min_deposit: u64 (8 bytes)
      // - bump: u8 (1 byte)
      const data = accountInfo.data;
      
      if (data.length < 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1) {
        console.error('Invalid pool account data length');
        return null;
      }
      
      let offset = 8 + 32 + 32 + 32; // discriminator + authority + token_mint + pool_vault
      
      const totalDeposits = data.readBigUInt64LE(offset);
      offset += 8;
      
      const totalBorrowed = data.readBigUInt64LE(offset);
      offset += 8;
      
      const interestRate = data.readBigUInt64LE(offset);
      offset += 8;
      
      const minDeposit = data.readBigUInt64LE(offset);
      
      // Calculate utilization
      const utilization = totalDeposits > 0n 
        ? Number((totalBorrowed * 10000n) / totalDeposits) / 100
        : 0;
      
      // APY is the interest rate (already in basis points)
      const apy = Number(interestRate) / 100;
      
      console.log('Pool data loaded:', {
        totalDeposits: totalDeposits.toString(),
        totalBorrowed: totalBorrowed.toString(),
        interestRate: interestRate.toString(),
        minDeposit: minDeposit.toString(),
      });

      return {
        address: lendingPoolAddress,
        tokenMint: 'Test USDC',
        totalDeposits: (Number(totalDeposits) / 1e6).toFixed(2),
        totalBorrowed: (Number(totalBorrowed) / 1e6).toFixed(2),
        interestRate: interestRate.toString(),
        utilization: utilization.toFixed(2),
        apy: apy.toFixed(2),
        minDeposit: (Number(minDeposit) / 1e6).toFixed(2),
      };
    } catch (error) {
      console.error('Error loading pool data:', error);
      return null;
    }
  }, []);

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
      
      // Pool vault is the associated token account for the lending pool PDA
      const poolVault = await deriveAssociatedTokenAddress(
        lendingPoolPubkey,
        mintPubkey
      );
      
      // Get depositor's token account
      const depositorTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        depositorPubkey
      );
      
      console.log('Depositing', amount, 'Test USDC to lending pool:', lendingPoolAddress);
      console.log('Depositor PDA:', depositorPDA.toBase58());
      console.log('Pool Vault:', poolVault.toBase58());
      console.log('Depositor Token Account:', depositorTokenAccount.toBase58());
      
      // Check if depositor's token account exists
      const accountInfo = await connection.getAccountInfo(depositorTokenAccount);
      const transaction = new Transaction();
      
      if (!accountInfo) {
        console.log('Creating depositor token account:', depositorTokenAccount.toBase58());
        const createTokenAccountIx = createAssociatedTokenAccountInstruction(
          depositorPubkey, // payer
          depositorTokenAccount, // associated token account
          depositorPubkey, // owner
          mintPubkey // mint
        );
        transaction.add(createTokenAccountIx);
      }
      
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
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
      });

      transaction.add(depositInstruction);
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
      
      // Pool vault is the associated token account for the lending pool PDA
      const poolVault = await deriveAssociatedTokenAddress(
        lendingPoolPubkey,
        mintPubkey
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
    loadPoolData,
    deposit,
    withdraw,
  };
}
