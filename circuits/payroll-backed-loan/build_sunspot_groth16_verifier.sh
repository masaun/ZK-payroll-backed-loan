#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Set default keypair and cluster from .env file - if not set in .env file
SOLANA_KEYPAIR=${SOLANA_KEYPAIR:-"$HOME/.config/solana/solana-deployer-keypair.json"}
SOLANA_CLUSTER=${SOLANA_CLUSTER:-"testnet"}

# Set the Solana cluster
echo "Setting Solana cluster to: $SOLANA_CLUSTER"
solana config set --url $(solana config get | grep "RPC URL" | awk '{print $3}' | sed "s/devnet/$SOLANA_CLUSTER/g")
solana config set --url https://api.$SOLANA_CLUSTER.solana.com

# Display current Solana configuration
solana config get
echo "Using keypair: $SOLANA_KEYPAIR"
echo "Current ZK_GROTH16_VERIFIER_PROGRAM_ID: $ZK_GROTH16_VERIFIER_PROGRAM_ID"

# Verify keypair exists
if [ ! -f "$SOLANA_KEYPAIR" ]; then
    echo "Error: Keypair file not found at $SOLANA_KEYPAIR"
    echo "Run: solana-keygen new -o $SOLANA_KEYPAIR"
    exit 1
fi

echo "Fetch a ZK_GROTH16_VERIFIER_PROGRAM_ID from .env file"
if [ -z "$ZK_GROTH16_VERIFIER_PROGRAM_ID" ]; then
    ZK_GROTH16_VERIFIER_PROGRAM_ID=$(solana program deploy target/payroll_backed_loan.so --keypair $SOLANA_KEYPAIR | grep "Program Id:" | awk '{print $3}')
    echo "Deployed new Program ID: $ZK_GROTH16_VERIFIER_PROGRAM_ID"
else
    solana program deploy target/payroll_backed_loan.so --program-id $ZK_GROTH16_VERIFIER_PROGRAM_ID --keypair $SOLANA_KEYPAIR
    echo "Using existing Program ID: $ZK_GROTH16_VERIFIER_PROGRAM_ID"
fi




# ===================
# Main script
# ===================
echo "Compile and execute"
nargo compile
nargo execute

echo "Sunspot pipeline"
sunspot compile target/payroll_backed_loan.json
sunspot setup target/payroll_backed_loan.ccs
sunspot prove target/payroll_backed_loan.json target/payroll_backed_loan.gz \
  target/payroll_backed_loan.ccs target/payroll_backed_loan.pk

echo "Build and deploy the Verifier contract on Solana testnet"
sunspot deploy target/payroll_backed_loan.vk
solana program deploy target/payroll_backed_loan.so --keypair $SOLANA_KEYPAIR

# Run the script files in the /payroll-backed-loan/client/verify-payroll-backed-loan-proof.ts
echo "Test client"
cd client && npm install  
npm run verify:payroll -- --program $ZK_GROTH16_VERIFIER_PROGRAM_ID --keypair ~/.config/solana/solana-deployer-keypair.json