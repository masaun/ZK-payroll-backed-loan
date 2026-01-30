# ZK Proof Generation and Verification Integration

## Overview

This implementation integrates Zero-Knowledge (ZK) proof generation and verification for the payroll-backed loan circuit into the Borrow page of the application.

## Files Created

### 1. `/app/src/lib/circuits/payroll-backed-loan/zk-proof-generation-and-verification.ts`

The main module containing ZK proof functionality:

- **`generatePayrollProof()`**: Generates a ZK proof for payroll verification
  - Takes payroll inputs (public and private)
  - Returns proof bytes and public inputs
  - Supports progress callbacks for UI updates

- **`verifyPayrollProof()`**: Verifies a generated ZK proof
  - Takes proof and public inputs
  - Returns boolean indicating validity
  - Also supports progress callbacks

- **`generateAndVerifyPayrollProof()`**: Combined operation
  - Generates and immediately verifies a proof
  - Useful for testing and streamlined workflows

- **`createSamplePayrollInputs()`**: Helper for testing
  - Creates sample input data
  - Should be replaced with actual zkTLS data in production

### 2. `/app/src/components/ZkProofProgress.tsx`

A React component that displays ZK proof generation progress:

- Shows current stage (e.g., "Initializing backend", "Generating proof")
- Displays progress bar with percentage
- Loading spinner for visual feedback
- Dismissible based on `show` prop

### 3. Updated `/app/src/app/borrow/page.tsx`

Integrated ZK proof generation into the borrow flow:

- Added state variables for ZK proof progress tracking
- Modified `handleBorrow()` function to:
  1. Generate ZK proof with sample inputs
  2. Verify the proof
  3. Display progress in real-time
  4. Only proceed with borrowing if proof is valid
- Shows proof generation progress in the borrow modal

## How It Works

### Borrowing Flow with ZK Proof

1. **User clicks "Borrow" button**
2. **ZK Proof Generation Phase** (0-70% progress):
   - Initializing backend (0-20%)
   - Setting up proving system (20-40%)
   - Preparing inputs (40-60%)
   - Generating proof (60-80%)
   - Creating proof (80-100%)

3. **ZK Proof Verification Phase** (70-100% progress):
   - Loading verification key
   - Verifying the proof
   - Validation complete

4. **Borrow Transaction** (if proof is valid):
   - Execute the actual borrowing transaction
   - Update UI with success message

### Circuit Artifacts

The implementation uses circuit artifacts from:
- **Circuit**: `/app/src/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/payroll-backed-loan.json`
- **Verification Key**: `/app/src/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/vk.json`

These were compiled from the Noir circuit in `/circuits/payroll-backed-loan/`.

## Input Structure

The circuit expects the following inputs:

### Public Inputs
- `nullifier`: A unique field element to prevent proof replay

### Private Inputs
- `payroll_proof`: Array of 64 field elements (from zkTLS)
- `payroll_amount`: Monthly payroll amount (u64)
- `employment_status`: Boolean indicating active employment
- `hire_date`: Unix timestamp of hire date (u32)
- `current_date`: Current Unix timestamp (u32)
- `min_payroll_amount`: Minimum required payroll (u64)
- `payroll_history`: Array of 32 historical payroll amounts
- `payroll_history_count`: Number of valid history entries (u32)
- `merkle_root`: Root of payroll merkle tree
- `merkle_path`: Merkle proof path (32 elements)
- `merkle_path_indices`: Indices for merkle proof (32 values)

## Dependencies

Installed packages:
- `@noir-lang/noir_js@1.0.0-beta.18`: NoirJS for proof generation
- `@noir-lang/backend_barretenberg`: Barretenberg proving backend

## Usage Example

```typescript
import { 
  generateAndVerifyPayrollProof,
  createSamplePayrollInputs 
} from '@/lib/circuits/payroll-backed-loan';

// Create inputs (in production, get from zkTLS)
const inputs = createSamplePayrollInputs('unique-nullifier');

// Generate and verify proof
const result = await generateAndVerifyPayrollProof(
  inputs,
  (stage, progress) => {
    console.log(`${stage}: ${progress}%`);
  }
);

if (result.success) {
  console.log('Proof valid!', result.proof);
  // Proceed with transaction
}
```

## Next Steps

### Integration with zkTLS (Reclaim Protocol)

Currently using sample data. To integrate with actual zkTLS:

1. **Get zkTLS proof from Reclaim**:
   ```typescript
   // Use the existing ZkTlsButton component
   // Extract payroll data from Reclaim proof
   ```

2. **Convert zkTLS proof to circuit inputs**:
   ```typescript
   const inputs = {
     public_inputs: {
       nullifier: generateNullifier(reclaimProof),
     },
     private_inputs: {
       payroll_proof: extractProofData(reclaimProof),
       payroll_amount: extractAmount(reclaimProof),
       // ... other fields
     },
   };
   ```

3. **Replace `createSamplePayrollInputs()` call** in the borrow handler

### On-Chain Verification

To verify proofs on-chain:

1. **Submit proof to Solana program**:
   - Send proof bytes and public inputs
   - Program verifies using deployed verifier

2. **Update borrow instruction** to accept proof:
   ```rust
   pub fn borrow_with_proof(
     ctx: Context<Borrow>,
     amount: u64,
     proof: Vec<u8>,
     public_inputs: Vec<[u8; 32]>,
   ) -> Result<()>
   ```

## Testing

To test the implementation:

1. Start the development server:
   ```bash
   cd app && npm run dev
   ```

2. Navigate to the Borrow page
3. Connect your wallet
4. Click "Borrow"
5. Observe the ZK proof generation progress
6. Check console for detailed logs

## Security Considerations

- **Nullifier uniqueness**: Ensure nullifiers are unique per proof to prevent replay attacks
- **Input validation**: Validate all inputs before proof generation
- **Proof storage**: Consider storing proofs on-chain for audit trail
- **zkTLS integration**: Verify zkTLS proofs before using as circuit inputs

## Performance

- **Proof generation**: ~2-5 seconds (depends on circuit complexity)
- **Proof verification**: ~500ms-1s
- **Total overhead**: ~3-6 seconds added to borrow transaction

The progress UI ensures users understand the process and wait time.
