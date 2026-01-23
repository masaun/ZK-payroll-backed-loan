#!/bin/bash

# zkTLS Integration Setup Script for Payroll-Backed Loan App

echo "🚀 Setting up zkTLS Integration for Payroll-Backed Loan App"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Skipping copy."
else
    echo "📋 Creating .env.local from .env.local.example..."
    cp .env.local.example .env.local
    echo "✅ .env.local created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your Reclaim Protocol credentials:"
    echo "   - RECLAIM_APP_ID"
    echo "   - RECLAIM_APP_SECRET"
    echo "   - RECLAIM_PROVIDER_ID"
    echo ""
    echo "   Get credentials from: https://dev.reclaimprotocol.org/"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Reclaim Protocol credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 For more information, see ZKTLS_INTEGRATION.md"
