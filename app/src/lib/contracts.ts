import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { PROGRAM_IDS, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@/config';

// Contract helper functions for interacting with deployed Solana programs

/**
 * Get the ZK Credential Manager program ID
 */
export function getZkCredentialProgramId(): PublicKey {
  return new PublicKey(PROGRAM_IDS.zkCredentialManager);
}

/**
 * Get the Lending program ID
 */
export function getLendingProgramId(): PublicKey {
  return new PublicKey(PROGRAM_IDS.lending);
}

/**
 * Get the Borrowing program ID
 */
export function getBorrowingProgramId(): PublicKey {
  return new PublicKey(PROGRAM_IDS.borrowing);
}

/**
 * Get SPL Token Program ID
 */
export function getTokenProgramId(): PublicKey {
  return new PublicKey(TOKEN_PROGRAM_ID);
}

/**
 * Get Associated Token Program ID
 */
export function getAssociatedTokenProgramId(): PublicKey {
  return new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID);
}

/**
 * Derive associated token account address
 * @param owner - The owner's public key
 * @param mint - The token mint public key
 * @returns The associated token account address
 */
export async function deriveAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const [address] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      getTokenProgramId().toBuffer(),
      mint.toBuffer(),
    ],
    getAssociatedTokenProgramId()
  );
  return address;
}

/**
 * Derive a PDA for a credential account
 * @param owner - The owner's public key
 * @param proofHash - The proof hash (32 bytes)
 * @returns The PDA and bump seed
 */
export async function deriveCredentialPDA(
  owner: PublicKey,
  proofHash: Uint8Array
): Promise<[PublicKey, number]> {
  const programId = getZkCredentialProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), owner.toBuffer(), Buffer.from(proofHash)],
    programId
  );
}

/**
 * Derive a PDA for a depositor account in the lending pool
 * @param depositor - The depositor's public key
 * @param lendingPool - The lending pool's public key
 * @returns The PDA and bump seed
 */
export async function deriveDepositorPDA(
  depositor: PublicKey,
  lendingPool: PublicKey
): Promise<[PublicKey, number]> {
  const programId = getLendingProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('depositor'), depositor.toBuffer(), lendingPool.toBuffer()],
    programId
  );
}

/**
 * Derive a PDA for a borrower account in the collateral pool
 * @param borrower - The borrower's public key
 * @param collateralPool - The collateral pool's public key
 * @returns The PDA and bump seed
 */
export async function deriveBorrowerPDA(
  borrower: PublicKey,
  collateralPool: PublicKey
): Promise<[PublicKey, number]> {
  const programId = getBorrowingProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('borrower'), borrower.toBuffer(), collateralPool.toBuffer()],
    programId
  );
}

/**
 * Create a connection to Solana devnet
 */
export function getConnection(): Connection {
  return new Connection('https://api.devnet.solana.com', 'confirmed');
}

/**
 * Program IDs for easy access
 */
export const CONTRACTS = {
  zkCredentialManager: PROGRAM_IDS.zkCredentialManager,
  lending: PROGRAM_IDS.lending,
  borrowing: PROGRAM_IDS.borrowing,
} as const;
