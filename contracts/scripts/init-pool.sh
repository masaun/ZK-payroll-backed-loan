#!/bin/bash

echo "🚀 Initializing Test USDC Lending Pool on Devnet"
echo ""

# Load environment variables
source .env

# Derive lending pool PDA
# Seeds: ["lending_pool", token_mint]
LENDING_POOL=$(solana address --seeds lending_pool,$TEST_USDC_MINT --program-id $LENDING_PROGRAM_ID 2>/dev/null || echo "")

if [ -z "$LENDING_POOL" ]; then
  echo "❌ Failed to derive lending pool PDA"
  exit 1
fi

echo "Test USDC Mint: $TEST_USDC_MINT"
echo "Lending Pool PDA: $LENDING_POOL"
echo ""

# Create pool vault (associated token account for the PDA)
echo "Creating pool vault..."
POOL_VAULT=$(spl-token create-account $TEST_USDC_MINT --owner $LENDING_POOL --fee-payer ./deployer-keypair.json 2>&1 | grep "Creating account" | awk '{print $3}')

if [ -z "$POOL_VAULT" ]; then
  # Try to get existing account
  POOL_VAULT=$(spl-token accounts $TEST_USDC_MINT --owner $LENDING_POOL 2>/dev/null | grep -A1 "Account" | tail -1 | awk '{print $1}')
fi

echo "Pool Vault: $POOL_VAULT"
echo ""

# Initialize lending pool using anchor
echo "Initializing lending pool..."
echo "  Interest Rate: 5%"
echo "  Min Deposit: 1 Test USDC"
echo ""

anchor idl init --filepath target/idl/lending.json $LENDING_PROGRAM_ID --provider.cluster devnet --provider.wallet ./deployer-keypair.json || true

# Call initialize function
# Note: You'll need to do this from the app or create a proper TypeScript script
echo "✅ Pool vault created"
echo ""
echo "Next steps:"
echo "=========="
echo "Update app/.env with:"
echo "NEXT_PUBLIC_LENDING_POOL_ADDRESS=$LENDING_POOL"
echo "NEXT_PUBLIC_LENDING_POOL_VAULT=$POOL_VAULT"
echo ""
echo "Then manually initialize the pool from your app or using anchor test command"
