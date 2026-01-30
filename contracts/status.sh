#!/bin/bash

# Script to monitor deployed contract status and balances

set -e

CONFIG_FILE="deployment-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Deployment configuration not found."
    echo "Run ./migrations/migrate.sh first to deploy and initialize contracts."
    exit 1
fi

echo "📊 ZK Payroll Backed Loan - Contract Status"
echo "==========================================="
echo ""

# Read configuration
CLUSTER=$(jq -r '.cluster' $CONFIG_FILE)
LENDING_POOL=$(jq -r '.lendingPool.address' $CONFIG_FILE)
LENDING_MINT=$(jq -r '.lendingPool.tokenMint' $CONFIG_FILE)
LENDING_VAULT=$(jq -r '.lendingPool.vault' $CONFIG_FILE)
COLLATERAL_POOL=$(jq -r '.collateralPool.address' $CONFIG_FILE)
COLLATERAL_MINT=$(jq -r '.collateralPool.collateralMint' $CONFIG_FILE)
COLLATERAL_VAULT=$(jq -r '.collateralPool.vault' $CONFIG_FILE)

echo "Cluster: $CLUSTER"
echo ""

# Set cluster
if [ "$CLUSTER" == "localnet" ]; then
    solana config set --url localhost > /dev/null 2>&1
else
    solana config set --url "$CLUSTER" > /dev/null 2>&1
fi

# Check lending pool
echo "🏦 Lending Pool Status"
echo "-----------------------------------"
echo "Pool Address: $LENDING_POOL"
echo "Token Mint:   $LENDING_MINT"
echo "Vault:        $LENDING_VAULT"
echo ""

# Check if pool account exists
if solana account "$LENDING_POOL" > /dev/null 2>&1; then
    echo "✅ Lending pool is deployed"
    
    # Check vault balance
    if command -v spl-token &> /dev/null; then
        VAULT_BALANCE=$(spl-token balance --address "$LENDING_VAULT" 2>/dev/null || echo "N/A")
        echo "Vault Balance: $VAULT_BALANCE"
    fi
else
    echo "❌ Lending pool not found"
fi
echo ""

# Check collateral pool
echo "🔒 Collateral Pool Status"
echo "-----------------------------------"
echo "Pool Address: $COLLATERAL_POOL"
echo "Token Mint:   $COLLATERAL_MINT"
echo "Vault:        $COLLATERAL_VAULT"
echo ""

# Check if pool account exists
if solana account "$COLLATERAL_POOL" > /dev/null 2>&1; then
    echo "✅ Collateral pool is deployed"
    
    # Check vault balance
    if command -v spl-token &> /dev/null; then
        VAULT_BALANCE=$(spl-token balance --address "$COLLATERAL_VAULT" 2>/dev/null || echo "N/A")
        echo "Vault Balance: $VAULT_BALANCE"
    fi
else
    echo "❌ Collateral pool not found"
fi
echo ""

# Check program accounts
echo "📦 Program Status"
echo "-----------------------------------"

ZK_PROGRAM=$(solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json 2>/dev/null || echo "Not found")
LENDING_PROGRAM=$(solana address -k target/deploy/lending-keypair.json 2>/dev/null || echo "Not found")
BORROWING_PROGRAM=$(solana address -k target/deploy/borrowing-keypair.json 2>/dev/null || echo "Not found")

echo "ZK Credential Manager: $ZK_PROGRAM"
if [ "$ZK_PROGRAM" != "Not found" ] && solana program show "$ZK_PROGRAM" > /dev/null 2>&1; then
    echo "  Status: ✅ Deployed"
else
    echo "  Status: ❌ Not deployed"
fi
echo ""

echo "Lending Program:       $LENDING_PROGRAM"
if [ "$LENDING_PROGRAM" != "Not found" ] && solana program show "$LENDING_PROGRAM" > /dev/null 2>&1; then
    echo "  Status: ✅ Deployed"
else
    echo "  Status: ❌ Not deployed"
fi
echo ""

echo "Borrowing Program:     $BORROWING_PROGRAM"
if [ "$BORROWING_PROGRAM" != "Not found" ] && solana program show "$BORROWING_PROGRAM" > /dev/null 2>&1; then
    echo "  Status: ✅ Deployed"
else
    echo "  Status: ❌ Not deployed"
fi
echo ""

echo "==========================================="
echo "Last deployed: $(jq -r '.timestamp' $CONFIG_FILE | xargs -I {} date -r {} 2>/dev/null || echo 'Unknown')"
