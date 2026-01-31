/**
 * Payroll-backed loan circuit exports
 * 
 * This module provides ZK proof generation and verification for payroll-backed loans
 */

export {
  generatePayrollBackedLoanProof,
  verifyPayrollBackedLoanProof,
  generateAndVerifyPayrollBackedLoanProof,
  createSamplePayrollBackedLoanInputs,
  hexToUint8Array,
  uint8ArrayToHex,
  numberToFieldHex,
  type PayrollBackedLoanProofInputs,
  type ProofGenerationResult,
  type ProgressCallback,
} from './zk-proof-generation-and-verification';
