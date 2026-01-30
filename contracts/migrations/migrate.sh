#!/bin/bash

# Migration script to deploy and initialize all contracts

set -e

echo "🚀 ZK Payroll Backed Loan - Contract Migration"
echo "=============================================="
echo ""

# Check environment
CLUSTER=${1:-localnet}
echo "Target Cluster: $CLUSTER"
echo ""

# Ensure programs are built
if [ ! -d "target/deploy" ]; then
    echo "❌ Programs not built. Run 'anchor build' first."
    exit 1
fi

# Deploy programs
echo "📦 Deploying programs..."
if [ "$CLUSTER" == "localnet" ]; then
    anchor deploy
else
    anchor deploy --provider.cluster "$CLUSTER"
fi
echo ""

# Get program IDs
ZK_CREDENTIAL_ID=$(solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json)
LENDING_ID=$(solana address -k target/deploy/lending-keypair.json)
BORROWING_ID=$(solana address -k target/deploy/borrowing-keypair.json)

echo "✅ Programs deployed:"
echo "  ZK Credential Manager: $ZK_CREDENTIAL_ID"
echo "  Lending Program:       $LENDING_ID"
echo "  Borrowing Program:     $BORROWING_ID"
echo ""

# Run TypeScript initialization
echo "🔧 Running initialization script..."
ts-node migrations/initialize.ts "$CLUSTER"
echo ""

echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Test the contracts: npm test"
echo "  2. Run examples: ts-node examples/complete-flow.ts"
