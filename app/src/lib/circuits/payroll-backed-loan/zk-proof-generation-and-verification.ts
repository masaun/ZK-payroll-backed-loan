import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend, BarretenbergVerifier } from '@noir-lang/backend_barretenberg';
import circuit from '@/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/payroll-backed-loan.json';
import vk from '@/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/vk.json';

/**
 * Progress callback type for ZK proof generation
 */
export type ProgressCallback = (stage: string, progress: number) => void;

/**
 * Input structure for payroll-backed loan ZK proof
 */
export interface PayrollProofInputs {
  // Public inputs
  public_inputs: {
    nullifier: string; // Field element as string
  };
  // Private inputs
  private_inputs: {
    payroll_proof: string[]; // Array of 64 field elements
    payroll_amount: string; // u64 as string
    employment_status: boolean;
    hire_date: string; // u32 as string
    current_date: string; // u32 as string
    min_payroll_amount: string; // u64 as string
    payroll_history: string[]; // Array of 32 u64 values as strings
    payroll_history_count: string; // u32 as string
    merkle_root: string; // Field element as string
    merkle_path: string[]; // Array of 32 field elements
    merkle_path_indices: string[]; // Array of 32 u32 values
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
export async function generatePayrollProof(
  inputs: PayrollProofInputs,
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
    const circuitInputs = {
      public_inputs: {
        nullifier: inputs.public_inputs.nullifier,
      },
      private_inputs: {
        payroll_proof: inputs.private_inputs.payroll_proof,
        payroll_amount: inputs.private_inputs.payroll_amount,
        employment_status: inputs.private_inputs.employment_status,
        hire_date: inputs.private_inputs.hire_date,
        current_date: inputs.private_inputs.current_date,
        min_payroll_amount: inputs.private_inputs.min_payroll_amount,
        payroll_history: inputs.private_inputs.payroll_history,
        payroll_history_count: inputs.private_inputs.payroll_history_count,
        merkle_root: inputs.private_inputs.merkle_root,
        merkle_path: inputs.private_inputs.merkle_path,
        merkle_path_indices: inputs.private_inputs.merkle_path_indices,
      },
    };

    onProgress?.('Generating proof', 60);

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
export async function verifyPayrollProof(
  proof: Uint8Array,
  publicInputs: Record<string, string>,
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    onProgress?.('Initializing verifier', 0);

    // Initialize the backend with the circuit
    const backend = new BarretenbergBackend(circuit as any);
    
    onProgress?.('Loading verification key', 30);

    // Initialize the verifier with the verification key
    const verifier = new BarretenbergVerifier({
      crsPath: undefined, // Will use default CRS
    });

    onProgress?.('Verifying proof', 60);

    // Verify the proof
    const isValid = await verifier.verifyProof({
      proof,
      publicInputs: Object.values(publicInputs).map(v => v),
    }, vk as any);

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
 */
export function createSamplePayrollInputs(
  nullifier: string = '0x123456789abcdef'
): PayrollProofInputs {
  // Generate sample payroll proof (64 field elements)
  const payrollProof = Array(64).fill('0');
  
  // Sample payroll history (32 values)
  const payrollHistory = Array(32).fill('0');
  // Set some sample values
  payrollHistory[0] = '5000000000'; // $5000 in cents
  payrollHistory[1] = '5200000000'; // $5200
  payrollHistory[2] = '5100000000'; // $5100
  
  // Sample merkle path (32 field elements)
  const merklePath = Array(32).fill('0');
  
  // Sample merkle path indices (32 values)
  const merklePathIndices = Array(32).fill('0');

  return {
    public_inputs: {
      nullifier,
    },
    private_inputs: {
      payroll_proof: payrollProof,
      payroll_amount: '5000000000', // $5000 in cents
      employment_status: true,
      hire_date: '1640995200', // Jan 1, 2022 as Unix timestamp
      current_date: Math.floor(Date.now() / 1000).toString(),
      min_payroll_amount: '3000000000', // $3000 minimum
      payroll_history: payrollHistory,
      payroll_history_count: '3',
      merkle_root: '0',
      merkle_path: merklePath,
      merkle_path_indices: merklePathIndices,
    },
  };
}

/**
 * Generate and verify a payroll proof in one operation
 * @param inputs - The proof inputs
 * @param onProgress - Optional callback to track overall progress
 * @returns True if proof was generated and verified successfully
 */
export async function generateAndVerifyPayrollProof(
  inputs: PayrollProofInputs,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; proof?: Uint8Array; publicInputs?: Record<string, string> }> {
  try {
    // Generate proof (0-70% of progress)
    const result = await generatePayrollProof(inputs, (stage, progress) => {
      onProgress?.(stage, progress * 0.7);
    });

    onProgress?.('Starting verification', 70);

    // Verify proof (70-100% of progress)
    const isValid = await verifyPayrollProof(
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
    return {
      success: false,
    };
  }
}
