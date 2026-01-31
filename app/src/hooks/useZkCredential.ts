import { useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { getZkCredentialProgramId, deriveCredentialPDA, getConnection } from '@/lib/contracts';

export interface Credential {
  proofHash: string;
  timestamp: number;
  isVerified: boolean;
  owner: string;
  proofType: string;
}

interface SolanaProvider {
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

export function useZkCredential() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana');

  const loadCredentials = useCallback(async (): Promise<Credential[]> => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return [];
    }

    try {
      const connection = getConnection();
      const programId = getZkCredentialProgramId();
      
      // Get all program accounts filtered by owner
      const ownerPubkey = new PublicKey(address);
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 8 + 32, // 8 bytes discriminator + 32 bytes proof_hash
              bytes: ownerPubkey.toBase58(),
            }
          }
        ]
      });

      console.log(`Found ${accounts.length} credentials for ${address}`);
      
      // Parse accounts (simplified - actual parsing depends on account structure)
      const credentials: Credential[] = accounts.map((account) => {
        const data = account.account.data;
        // This is a simplified example - you'll need to match your actual account structure
        return {
          proofHash: account.pubkey.toBase58(),
          timestamp: Date.now() / 1000,
          isVerified: false,
          owner: address,
          proofType: 'Payroll'
        };
      });

      return credentials;
    } catch (error) {
      console.error('Error loading credentials:', error);
      return [];
    }
  }, [isConnected, address]);

  const storeProof = useCallback(async (
    proofData: string,
    publicOutput: string,
    proofHash: Uint8Array
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const programId = getZkCredentialProgramId();
      const ownerPubkey = new PublicKey(address);
      
      // Derive credential PDA
      const [credentialPDA] = await deriveCredentialPDA(ownerPubkey, proofHash);
      
      console.log('Storing proof to credential PDA:', credentialPDA.toBase58());
      
      // Build instruction (simplified - you'll need to match your actual instruction)
      // Note: This requires the actual IDL and @coral-xyz/anchor
      // For now, we'll create a simple transaction as a placeholder
      
      const transaction = new Transaction();
      // TODO: Add actual instruction using @coral-xyz/anchor
      // const instruction = await program.methods
      //   .storeZkTlsProofAndPublicOutput(
      //     Array.from(Buffer.from(proofData)),
      //     Array.from(Buffer.from(publicOutput)),
      //     Array.from(proofHash)
      //   )
      //   .accounts({
      //     credential: credentialPDA,
      //     owner: ownerPubkey,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();
      // transaction.add(instruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      // Sign and send transaction
      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Proof stored with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error storing proof:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const verifyCredential = useCallback(async (proofHash: Uint8Array): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const ownerPubkey = new PublicKey(address);
      
      // Derive credential PDA
      const [credentialPDA] = await deriveCredentialPDA(ownerPubkey, proofHash);
      
      console.log('Verifying credential:', credentialPDA.toBase58());
      
      // TODO: Build and send verification transaction
      // This requires authority signature - typically done by a separate authority account
      
      throw new Error('Verification requires authority signature');
    } catch (error) {
      console.error('Error verifying credential:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  const revokeCredential = useCallback(async (proofHash: Uint8Array): Promise<string> => {
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getConnection();
      const ownerPubkey = new PublicKey(address);
      
      // Derive credential PDA
      const [credentialPDA] = await deriveCredentialPDA(ownerPubkey, proofHash);
      
      console.log('Revoking credential:', credentialPDA.toBase58());
      
      const transaction = new Transaction();
      // TODO: Add actual revoke instruction
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      const provider = walletProvider as unknown as SolanaProvider;
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Credential revoked with signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider]);

  return {
    loadCredentials,
    storeProof,
    verifyCredential,
    revokeCredential,
  };
}
