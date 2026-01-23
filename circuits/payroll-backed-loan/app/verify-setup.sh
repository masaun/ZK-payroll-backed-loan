#!/bin/bash

# zkTLS Configuration Verification Script

echo "🔍 Verifying zkTLS Integration Setup..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local file exists"
    
    # Check for required variables
    if grep -q "RECLAIM_APP_ID=" .env.local; then
        app_id=$(grep "RECLAIM_APP_ID=" .env.local | cut -d '=' -f2)
        if [ "$app_id" = "your_app_id_here" ] || [ -z "$app_id" ]; then
            echo -e "${RED}✗${NC} RECLAIM_APP_ID not configured"
            HAS_ERROR=1
        else
            echo -e "${GREEN}✓${NC} RECLAIM_APP_ID is set"
        fi
    else
        echo -e "${RED}✗${NC} RECLAIM_APP_ID not found in .env.local"
        HAS_ERROR=1
    fi
    
    if grep -q "RECLAIM_APP_SECRET=" .env.local; then
        app_secret=$(grep "RECLAIM_APP_SECRET=" .env.local | cut -d '=' -f2)
        if [ "$app_secret" = "your_app_secret_here" ] || [ -z "$app_secret" ]; then
            echo -e "${RED}✗${NC} RECLAIM_APP_SECRET not configured"
            HAS_ERROR=1
        else
            echo -e "${GREEN}✓${NC} RECLAIM_APP_SECRET is set"
        fi
    else
        echo -e "${RED}✗${NC} RECLAIM_APP_SECRET not found in .env.local"
        HAS_ERROR=1
    fi
    
    if grep -q "RECLAIM_PROVIDER_ID=" .env.local; then
        provider_id=$(grep "RECLAIM_PROVIDER_ID=" .env.local | cut -d '=' -f2)
        if [ -z "$provider_id" ]; then
            echo -e "${YELLOW}⚠${NC} RECLAIM_PROVIDER_ID is empty (will use default)"
        else
            echo -e "${GREEN}✓${NC} RECLAIM_PROVIDER_ID is set to: $provider_id"
        fi
    else
        echo -e "${YELLOW}⚠${NC} RECLAIM_PROVIDER_ID not found (will use default)"
    fi
else
    echo -e "${RED}✗${NC} .env.local file not found"
    echo -e "${YELLOW}→${NC} Run: cp .env.local.example .env.local"
    HAS_ERROR=1
fi

echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    
    # Check if Reclaim SDK is installed
    if [ -d "node_modules/@reclaimprotocol/js-sdk" ]; then
        echo -e "${GREEN}✓${NC} @reclaimprotocol/js-sdk is installed"
    else
        echo -e "${RED}✗${NC} @reclaimprotocol/js-sdk not found"
        echo -e "${YELLOW}→${NC} Run: npm install"
        HAS_ERROR=1
    fi
else
    echo -e "${RED}✗${NC} node_modules not found"
    echo -e "${YELLOW}→${NC} Run: npm install"
    HAS_ERROR=1
fi

echo ""

# Check if required files exist
echo "Checking integration files..."

files=(
    "src/lib/zktls/zktls-operation.ts"
    "src/hooks/useZkTlsProof.ts"
    "src/components/ZkTlsButton.tsx"
    "src/app/api/reclaim/create-proof-request/route.ts"
    "src/app/api/reclaim/verify-proof/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
        HAS_ERROR=1
    fi
done

echo ""
echo "============================================"

if [ -z "$HAS_ERROR" ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Ready to start!"
    echo "   Run: npm run dev"
    echo "   Visit: http://localhost:3000"
else
    echo -e "${RED}✗ Configuration incomplete${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy .env.local.example to .env.local"
    echo "   2. Add your Reclaim credentials to .env.local"
    echo "   3. Run: npm install"
    echo "   4. Run this verification script again"
    echo ""
    echo "📚 Get credentials from: https://dev.reclaimprotocol.org/"
fi

echo "============================================"
