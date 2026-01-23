/**
 * Proof Helper - Types and utilities for circuit proof generation
 * 
 * Note: This file provides type definitions for compatibility.
 * For full circuit proof generation, use the client directory.
 * The app directory focuses on zkTLS proof generation via Reclaim Protocol.
 */

export interface CircuitConfig {
  circuitDir: string;
  circuitName: string;
}

export interface ProofResult {
  proof: Uint8Array;
  publicInputs: string[];
}

export interface SmtExclusionInputs {
  smt_root: string;
  pubkey_hash: string;
  pubkey: number[];
  siblings: string[];
  leaf_value: string;
}

export const TEST_VALUES = {
  pubkey: "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
};

/**
 * Note: Circuit proof generation functions are available in the client directory.
 * This app focuses on zkTLS (Reclaim Protocol) integration for payroll verification.
 * 
 * For circuit-based proofs, see: ../client/proof.helper.ts
 */
