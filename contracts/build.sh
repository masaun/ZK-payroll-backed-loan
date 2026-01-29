#!/bin/bash

# Build script for Solana smart contracts

set -e

echo "🔨 Building ZK Payroll Backed Loan Contracts..."
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI is not installed"
    echo "Please install Anchor: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI is not installed"
    echo "Please install Solana: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
anchor clean
echo ""

# Build all programs
echo "🔨 Building all programs..."
anchor build
echo ""

# Show program IDs
echo "📋 Program IDs:"
echo "-----------------------------------"
solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json 2>/dev/null && \
  echo "ZK Credential Manager: $(solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json)" || \
  echo "ZK Credential Manager: Not found"
  
solana address -k target/deploy/lending-keypair.json 2>/dev/null && \
  echo "Lending Program:       $(solana address -k target/deploy/lending-keypair.json)" || \
  echo "Lending Program: Not found"
  
solana address -k target/deploy/borrowing-keypair.json 2>/dev/null && \
  echo "Borrowing Program:     $(solana address -k target/deploy/borrowing-keypair.json)" || \
  echo "Borrowing Program: Not found"
echo "-----------------------------------"
echo ""

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Update program IDs in Anchor.toml and lib.rs files"
echo "  2. Deploy with: ./deploy.sh"
