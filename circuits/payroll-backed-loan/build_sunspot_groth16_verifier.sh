#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Set default keypair if not set in .env
SOLANA_KEYPAIR=${SOLANA_KEYPAIR:-"$HOME/.config/solana/solana-deployer-keypair.json"}

echo "Using keypair: $SOLANA_KEYPAIR"
echo "Current PROGRAM_ID: $PROGRAM_ID"

# Verify keypair exists
if [ ! -f "$SOLANA_KEYPAIR" ]; then
    echo "Error: Keypair file not found at $SOLANA_KEYPAIR"
    echo "Run: solana-keygen new -o $SOLANA_KEYPAIR"
    exit 1
fi

echo "Fetch a PROGRAM_ID from .env file"
if [ -z "$PROGRAM_ID" ]; then
    PROGRAM_ID=$(solana program deploy target/payroll_backed_loan.so --keypair $SOLANA_KEYPAIR | grep "Program Id:" | awk '{print $3}')
    echo "Deployed new Program ID: $PROGRAM_ID"
else
    solana program deploy target/payroll_backed_loan.so --program-id $PROGRAM_ID --keypair $SOLANA_KEYPAIR
    echo "Using existing Program ID: $PROGRAM_ID"
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

echo "Build and deploy verifier"
sunspot deploy target/payroll_backed_loan.vk
solana program deploy target/payroll_backed_loan.so

echo "Test client"
cd client && npm install  
npm run verify -- --program $PROGRAM_ID --keypair ~/.config/solana/solana-deployer-keypair.json
npm run test-transfer  # Integration test with SOL transfers