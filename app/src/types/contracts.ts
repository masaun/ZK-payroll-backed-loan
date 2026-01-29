import { PublicKey } from '@solana/web3.js';

// Lending Pool Types
export interface LendingPool {
  authority: PublicKey;
  tokenMint: PublicKey;
  poolVault: PublicKey;
  totalDeposits: number;
  totalBorrowed: number;
  interestRate: number;
  minDeposit: number;
  bump: number;
}

export interface DepositorAccount {
  depositor: PublicKey;
  lendingPool: PublicKey;
  depositedAmount: number;
  depositTimestamp: number;
}

// Borrowing Pool Types
export interface CollateralPool {
  authority: PublicKey;
  collateralMint: PublicKey;
  poolVault: PublicKey;
  totalCollateral: number;
  collateralRatio: number;
  liquidationThreshold: number;
  bump: number;
}

export interface BorrowerState {
  borrower: PublicKey;
  collateralPool: PublicKey;
  collateralAmount: number;
  borrowedAmount: number;
  collateralTimestamp: number;
  borrowTimestamp: number;
}

// ZK Credential Types
export interface ZkCredential {
  owner: PublicKey;
  proofData: Uint8Array;
  publicOutput: Uint8Array;
  proofHash: number[];
  timestamp: number;
  isVerified: boolean;
  bump: number;
}

// UI Display Types
export interface PoolStats {
  totalValue: string;
  apy: string;
  utilization: string;
  available: string;
}

export interface UserPosition {
  amount: string;
  value: string;
  apy: string;
  earned: string;
}
