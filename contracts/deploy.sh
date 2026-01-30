#!/bin/bash

# Deployment script for Solana smart contracts

set -e

# Default to localnet
CLUSTER=${1:-localnet}

echo "🚀 Deploying ZK Payroll Backed Loan Contracts to $CLUSTER..."
echo ""

# Validate cluster argument
if [[ ! "$CLUSTER" =~ ^(localnet|devnet|mainnet-beta)$ ]]; then
    echo "❌ Invalid cluster. Use: localnet, devnet, or mainnet-beta"
    exit 1
fi

# Check if programs are built
if [ ! -d "target/deploy" ]; then
    echo "❌ Programs not built. Run ./build.sh first"
    exit 1
fi

# Set Solana cluster
if [ "$CLUSTER" == "localnet" ]; then
    solana config set --url localhost
    PROVIDER_URL="http://localhost:8899"
else
    solana config set --url "$CLUSTER"
    PROVIDER_URL="https://api.$CLUSTER.solana.com"
fi

echo "📡 Connected to: $PROVIDER_URL"
echo ""

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2.0" | bc -l) )); then
    echo "⚠️  Warning: Low balance. You may need more SOL for deployment."
    
    if [ "$CLUSTER" == "devnet" ]; then
        echo "💧 Requesting airdrop on devnet..."
        solana airdrop 2 || echo "⚠️  Airdrop may have failed, continuing anyway..."
    fi
fi
echo ""

# Deploy programs
echo "🚀 Deploying programs..."
echo ""

if [ "$CLUSTER" == "localnet" ]; then
    # For localnet, ensure test validator is running
    if ! pgrep -x "solana-test-val" > /dev/null; then
        echo "⚠️  Warning: Local validator doesn't appear to be running"
        echo "Start it with: solana-test-validator"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Deploy using Anchor
anchor deploy --provider.cluster "$CLUSTER"
echo ""

# Show deployed program IDs
echo "✅ Deployment completed!"
echo ""
echo "📋 Deployed Program IDs:"
echo "-----------------------------------"
echo "ZK Credential Manager: $(solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json)"
echo "Lending Program:       $(solana address -k target/deploy/lending-keypair.json)"
echo "Borrowing Program:     $(solana address -k target/deploy/borrowing-keypair.json)"
echo "-----------------------------------"
echo ""
echo "⚠️  Important: Update these program IDs in:"
echo "  - Anchor.toml"
echo "  - programs/*/src/lib.rs (declare_id! macro)"
echo ""
echo "Then rebuild and redeploy to verify the IDs match."
