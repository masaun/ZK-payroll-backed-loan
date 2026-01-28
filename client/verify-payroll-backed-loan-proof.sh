# Navigate to the client directory
cd circuits/payroll-backed-loan/client

# Run the verification (uses ZK_GROTH16_VERIFIER_PROGRAM_ID from .env)
npm run verify:payroll

# Or with custom program ID
npm run verify:payroll -- --program ${ZK_GROTH16_VERIFIER_PROGRAM_ID}

# Test with corrupted proof (should fail)
npm run verify:payroll -- --corrupt

# Use different RPC endpoint
npm run verify:payroll -- --rpc https://api.testnet.solana.com