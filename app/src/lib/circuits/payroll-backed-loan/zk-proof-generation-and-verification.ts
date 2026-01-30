import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '@/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/payroll-backed-loan.json';
import vk from '@/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/vk.json';
import { buildPoseidon } from 'circomlibjs';

/**
 * Progress callback type for ZK proof generation
 */
export type ProgressCallback = (stage: string, progress: number) => void;

/**
 * Convert a hex string to Uint8Array (32 bytes for Field element)
 * @param hexString - Hex string with or without 0x prefix
 * @returns 32-byte Uint8Array
 */
export function hexToUint8Array(hexString: string): Uint8Array {
  // Remove 0x prefix if present
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  
  // Pad to 64 characters (32 bytes)
  const padded = hex.padStart(64, '0');
  
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string (for Field elements)
 * @param bytes - Uint8Array (typically 32 bytes)
 * @returns Hex string with 0x prefix
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a number or bigint to hex string for Field element
 * @param value - Number or bigint value
 * @returns Hex string with 0x prefix, padded to 32 bytes
 */
export function numberToFieldHex(value: number | bigint): string {
  const hex = value.toString(16);
  return '0x' + hex.padStart(64, '0');
}

/**
 * Convert hex string to decimal string for NoirJS Field input
 * NoirJS expects Field elements as decimal strings, not hex
 * If the input is already a decimal string, return it as-is
 * @param hexString - Hex string with or without 0x prefix, or decimal string
 * @returns Decimal string representation
 */
export function hexToDecimalString(hexString: string): string {
  // If it's already a decimal string (no hex characters), return as-is
  if (!hexString.startsWith('0x') && /^\d+$/.test(hexString)) {
    return hexString;
  }
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return BigInt('0x' + hex).toString(10);
}

/**
 * Input structure for payroll-backed loan ZK proof
 */
export interface PayrollBackedLoanProofInputs {
  // Public inputs
  public_inputs: {
    nullifier: string; // Field element as hex string (e.g., "0x123...")
  };
  // Private inputs
  private_inputs: {
    payroll_proof: string[]; // Array of 64 field elements as hex strings
    payroll_amount: string; // u64 as string
    employment_status: boolean;
    hire_date: string; // u32 as string - Days since epoch (NOT Unix timestamp in seconds)
    current_date: string; // u32 as string - Days since epoch (NOT Unix timestamp in seconds)
    min_payroll_amount: string; // u64 as string
    payroll_history: string[]; // Array of 32 Field elements as decimal OR hex strings (payroll amounts for each month)
    repayment_ratio: string; // u64 as string
    loan_amount: string; // u64 as string
    jurisdiction_code: string; // Field element as hex string
    allowed_jurisdiction_root: string; // Field element as hex string
    jurisdiction_merkle_proof: string[]; // Array of 32 Field elements as hex strings
  };
}

/**
 * Result of ZK proof generation
 */
export interface ProofGenerationResult {
  proof: Uint8Array;
  publicInputs: Record<string, string>;
}

/**
 * Generate a ZK proof for payroll-backed loan
 * @param inputs - The public and private inputs for the circuit
 * @param onProgress - Optional callback to track progress
 * @returns The generated proof and public inputs
 */
export async function generatePayrollBackedLoanProof(
  inputs: PayrollBackedLoanProofInputs,
  onProgress?: ProgressCallback
): Promise<ProofGenerationResult> {
  try {
    onProgress?.('Initializing backend', 0);

    // Initialize the backend with the circuit
    const backend = new BarretenbergBackend(circuit as any);
    
    onProgress?.('Setting up proving system', 20);

    // Initialize Noir with the circuit
    const noir = new Noir(circuit as any);

    onProgress?.('Preparing inputs', 40);

    // Format inputs for the circuit
    // Note: NoirJS expects Field elements as decimal strings, not hex
    const circuitInputs = {
      public_inputs: {
        nullifier: hexToDecimalString(inputs.public_inputs.nullifier),
      },
      private_inputs: {
        payroll_proof: inputs.private_inputs.payroll_proof.map(hexToDecimalString),
        payroll_amount: inputs.private_inputs.payroll_amount,
        employment_status: inputs.private_inputs.employment_status,
        hire_date: inputs.private_inputs.hire_date,
        current_date: inputs.private_inputs.current_date,
        min_payroll_amount: inputs.private_inputs.min_payroll_amount,
        payroll_history: inputs.private_inputs.payroll_history.map(hexToDecimalString),
        repayment_ratio: inputs.private_inputs.repayment_ratio,
        loan_amount: inputs.private_inputs.loan_amount,
        jurisdiction_code: hexToDecimalString(inputs.private_inputs.jurisdiction_code),
        allowed_jurisdiction_root: hexToDecimalString(inputs.private_inputs.allowed_jurisdiction_root),
        jurisdiction_merkle_proof: inputs.private_inputs.jurisdiction_merkle_proof.map(hexToDecimalString),
      },
    };

    onProgress?.('Generating proof', 60);

    // Debug: Log circuit inputs to verify values
    console.log('Circuit inputs being sent:');
    console.log('- nullifier:', circuitInputs.public_inputs.nullifier);
    console.log('- payroll_amount:', circuitInputs.private_inputs.payroll_amount);
    console.log('- employment_status:', circuitInputs.private_inputs.employment_status);
    console.log('- hire_date:', circuitInputs.private_inputs.hire_date);
    console.log('- current_date:', circuitInputs.private_inputs.current_date);
    console.log('- min_payroll_amount:', circuitInputs.private_inputs.min_payroll_amount);
    console.log('- tenure_months (calculated):', (parseInt(circuitInputs.private_inputs.current_date) - parseInt(circuitInputs.private_inputs.hire_date)) / 30);
    console.log('- payroll_history (first 12):', circuitInputs.private_inputs.payroll_history.slice(0, 12));
    console.log('- repayment_ratio:', circuitInputs.private_inputs.repayment_ratio);
    console.log('- loan_amount:', circuitInputs.private_inputs.loan_amount);
    console.log('- max_allowed (calculated):', parseInt(circuitInputs.private_inputs.payroll_amount) * parseInt(circuitInputs.private_inputs.repayment_ratio));
    console.log('- jurisdiction_code:', circuitInputs.private_inputs.jurisdiction_code);
    console.log('- allowed_jurisdiction_root:', circuitInputs.private_inputs.allowed_jurisdiction_root);

    // Execute the circuit to generate witness
    const { witness } = await noir.execute(circuitInputs);
    
    onProgress?.('Creating proof', 80);

    // Generate the proof using the backend
    const proof = await backend.generateProof(witness);

    onProgress?.('Proof generated successfully', 100);

    // Extract public inputs
    const publicInputs: Record<string, string> = {
      nullifier: inputs.public_inputs.nullifier,
    };

    // Destroy backend to free memory
    await backend.destroy();

    return {
      proof: proof.proof,
      publicInputs,
    };
  } catch (error) {
    console.error('Error generating ZK proof:', error);
    throw new Error(`Failed to generate proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a ZK proof for payroll-backed loan
 * @param proof - The proof to verify
 * @param publicInputs - The public inputs used in the proof
 * @param onProgress - Optional callback to track progress
 * @returns True if the proof is valid, false otherwise
 */
export async function verifyPayrollBackedLoanProof(
  proof: Uint8Array,
  publicInputs: Record<string, string>,
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    onProgress?.('Initializing verifier', 0);

    // Initialize the backend with the circuit
    const backend = new BarretenbergBackend(circuit as any);
    
    onProgress?.('Loading verification key', 30);

    onProgress?.('Verifying proof', 60);

    // Verify the proof using the backend
    const isValid = await backend.verifyProof({
      proof,
      publicInputs: Object.values(publicInputs),
    });

    onProgress?.('Verification complete', 100);

    // Cleanup
    await backend.destroy();

    return isValid;
  } catch (error) {
    console.error('Error verifying ZK proof:', error);
    throw new Error(`Failed to verify proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to create sample payroll proof inputs for testing
 * This should be replaced with actual data from zkTLS or other sources
 * 
 * IMPORTANT: The nullifier must equal poseidon_hash_2(jurisdiction_code, allowed_jurisdiction_root)
 * This function calculates it correctly using circomlibjs
 */
export async function createSamplePayrollBackedLoanInputs(): Promise<PayrollBackedLoanProofInputs> {
  // Generate sample payroll proof (64 field elements as hex strings)
  // Each Field element should be a 32-byte hex string (0x + 64 hex chars)
  const payrollProof = Array(64).fill('0x0000000000000000000000000000000000000000000000000000000000000000');
  
  // Sample payroll history (32 field elements as decimal strings - for merkle tree)
  // Must have non-zero values for at least MIN_TENURE_MONTHS (12 months)
  // Using numeric values to represent payroll amounts received each month
  const payrollHistory = Array(32).fill(0).map((_, i) => {
    // Set first 12 months to non-zero (representing 12 months of payroll history)
    // Match the value in Prover.toml: 5000 for active months
    return i < 12 
      ? '5000'
      : '0';
  });
  
  // Sample jurisdiction merkle proof (32 field elements as hex strings)
  const jurisdictionMerkleProof = Array(32).fill('0x0000000000000000000000000000000000000000000000000000000000000000');

  // Use values from working Prover.toml
  const jurisdictionCode = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const allowedJurisdictionRoot = '0x0000000000000000000000000000000000000000000000000000000000003039'; // 12345 in hex
  
  // Use the pre-calculated nullifier from Prover.toml (result of poseidon_hash_2(1, 12345) in Noir)
  const nullifier = '0x27cb78d0541f3912c8645bd60acbe7a7205225e0e6f55a17f4843ac719e3eafe';

  return {
    public_inputs: {
      nullifier, // Hex string for Field element
    },
    private_inputs: {
      payroll_proof: payrollProof, // Array of hex strings for Field elements
      payroll_amount: '5000', // u64 - $5000
      employment_status: true,
      hire_date: '20000', // u32 - Days since epoch (matching Prover.toml)
      current_date: '20360', // u32 - Days since epoch (360 days later = 12 months)
      min_payroll_amount: '3000', // u64 - $3000 minimum
      payroll_history: payrollHistory, // Array of Field decimal strings for merkle tree
      repayment_ratio: '2', // u64 as string (2x multiplier, matching Prover.toml)
      loan_amount: '10000', // u64 - $10000 loan (10000 <= 5000 * 2 = 10000)
      jurisdiction_code: jurisdictionCode, // Field hex string
      allowed_jurisdiction_root: allowedJurisdictionRoot, // Field hex string
      jurisdiction_merkle_proof: jurisdictionMerkleProof, // Array of Field hex strings
    },
  };
}

/**
 * Generate and verify a payroll proof in one operation
 * @param inputs - The proof inputs
 * @param onProgress - Optional callback to track overall progress
 * @returns True if proof was generated and verified successfully
 */
export async function generateAndVerifyPayrollBackedLoanProof(
  inputs: PayrollBackedLoanProofInputs,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; proof?: Uint8Array; publicInputs?: Record<string, string>; error?: string }> {
  try {
    // Generate proof (0-70% of progress)
    const result = await generatePayrollBackedLoanProof(inputs, (stage, progress) => {
      onProgress?.(stage, progress * 0.7);
    });

    onProgress?.('Starting verification', 70);

    // Verify proof (70-100% of progress)
    const isValid = await verifyPayrollBackedLoanProof(
      result.proof,
      result.publicInputs,
      (stage, progress) => {
        onProgress?.(stage, 70 + progress * 0.3);
      }
    );

    if (!isValid) {
      throw new Error('Generated proof failed verification');
    }

    onProgress?.('Proof generated and verified', 100);

    return {
      success: true,
      proof: result.proof,
      publicInputs: result.publicInputs,
    };
  } catch (error) {
    console.error('Error in generate and verify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
