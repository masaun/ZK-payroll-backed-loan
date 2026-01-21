# From repo root
echo "Setting up Circuit One..."
just install-one        # Install client dependencies
just test-one           # Run circuit tests
just prove-one          # Compile + execute + generate proof
just build-verifier-one # Build Solana verifier (.so)

# Deploy verifier to Solana devnet (manual step)
echo "Deploying Circuit One verifier to Solana devnet..."
solana program deploy circuits/one/target/one.so \
  --keypair circuits/one/keypair/deployer.json \
  --program-id circuits/one/target/circuit_one-keypair.json \
  --url devnet

# Update PROGRAM_ID in client/verify.ts with the deployed address, then:]
echo "Updating PROGRAM_ID in client/verify.ts..."
just verify-one         # Verify proof on-chain