#!/bin/bash

# Initialize collateral pool for Test USDC
# Run this script from the contracts directory

set -e

echo "🚀 Initializing Collateral Pool for Test USDC"
echo "=============================================="
echo ""

# Check if TEST_USDC_MINT is set
if [ -z "$TEST_USDC_MINT" ]; then
  echo "❌ ERROR: TEST_USDC_MINT environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "export TEST_USDC_MINT=<your-test-usdc-mint-address>"
  echo ""
  echo "You can find the Test USDC mint address in:"
  echo "- contracts/target/deploy/test_usdc-keypair.json"
  echo "- Or from the deployment logs"
  exit 1
fi

echo "Test USDC Mint: $TEST_USDC_MINT"
echo ""

# Run the initialization script
npx ts-node scripts/init-collateral-pool.ts

echo ""
echo "✅ Done!"
