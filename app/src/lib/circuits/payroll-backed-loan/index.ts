/**
 * Payroll-backed loan circuit exports
 * 
 * This module provides ZK proof generation and verification for payroll-backed loans
 */

export {
  generatePayrollProof,
  verifyPayrollProof,
  generateAndVerifyPayrollProof,
  createSamplePayrollInputs,
  type PayrollProofInputs,
  type ProofGenerationResult,
  type ProgressCallback,
} from './zk-proof-generation-and-verification';
