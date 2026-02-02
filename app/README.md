# ZK Payroll-Backed Loan - Frontend Application

The Next.js frontend application for the ZK Payroll-Backed Loan platform, enabling privacy-preserving payroll verification and decentralized borrowing on Solana.

## Overview

This is the user-facing web application that combines zkTLS payroll verification with Noir zero-knowledge circuits to enable collateral-free lending based on verified income. The application provides an intuitive interface for:

- **Borrowers**: Verify payroll via zkTLS, generate ZK proofs, and obtain loans without traditional collateral
- **Lenders**: Deposit funds into lending pools and earn interest from borrowers
- **Privacy**: Zero-knowledge proofs ensure sensitive payroll data never leaves the user's device in plaintext

### Key Features

- 🔐 **zkTLS Payroll Proof Verification**: Generate a zkTLS Payroll Proof to prove a borrower's payroll/income and employment using Reclaim Protocol without sharing credentials
- 🧮 **Noir ZK Circuit Integration**: Generate a ZK Payroll-Backed Loan Proof to prove a loan eligibility of borrower, on client-side
- 💎 **Solana Wallet Integration**: Connect wallets via Reown AppKit for seamless transactions
- 🎨 **Modern UI**: Built with Next.js 15, React 19, and Bootstrap 5
- 🛡️ **Privacy-First**: All sensitive data processed via zero-knowledge proofs
- 📱 **Multi-Platform**: QR code, browser extension, or mobile app for zkTLS verification

## Installation

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn** package manager
- **Solana wallet** (Phantom, Solflare, etc.)
- **Reclaim Protocol account** (for zkTLS) - [Sign up here](https://dev.reclaimprotocol.org/)
- **Reown AppKit Project ID** - [Get one here](https://dashboard.reown.com)

### Step 1: Install Dependencies

```bash
npm install
```

Or with yarn:
```bash
yarn install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the app directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Reclaim Protocol (zkTLS)
RECLAIM_APP_ID=your_reclaim_app_id
RECLAIM_APP_SECRET=your_reclaim_app_secret
RECLAIM_PROVIDER_ID=your_payroll_provider_id

# Optional: Reown AppKit (if customizing)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
```

**Get Your Credentials:**
- **Reclaim Protocol**: Visit [Reclaim DevTool](https://dev.reclaimprotocol.org/) and follow the [API Key Guide](https://docs.reclaimprotocol.org/api-key)
- **Reown AppKit**: Create a project at [Reown Dashboard](https://dashboard.reown.com)

### Step 3: Verify Setup (Optional)

Run the verification script to check your configuration:

```bash
./verify-setup.sh
```

### Step 4: Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Step 5: Build for Production

```bash
npm run build
npm run start
```


## 📚 Documentation

- **[ZKTLS_INTEGRATION.md](./ZKTLS_INTEGRATION.md)**: Comprehensive integration guide
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)**: What was implemented
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: Quick reference card

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Solana (via Reown AppKit)
- **zkTLS**: Reclaim Protocol JS SDK
- **Wallet**: Reown AppKit with Solana adapter


## 🐛 Troubleshooting

Run the verification script:
```bash
./verify-setup.sh
```

Common issues:
- **Missing credentials**: Add them to `.env.local`
- **Server won't start**: Restart after adding env variables
- **Proof fails**: Check provider ID is correct

## References

### Zero-Knowledge Proofs
- [Noir Language Documentation](https://noir-lang.org/) - ZK circuit programming language
- [Aztec bb.js Documentation](https://docs.aztec.network/) - Proving backend
- [Poseidon Hash Function](https://www.poseidon-hash.info/) - ZK-friendly hashing

### zkTLS & Reclaim Protocol
- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/) - Comprehensive guide
- [Reclaim Developer Console](https://dev.reclaimprotocol.org/) - Get API credentials
- [Reclaim JS SDK](https://www.npmjs.com/package/@reclaimprotocol/js-sdk) - npm package
- [zkTLS Technical Overview](https://docs.reclaimprotocol.org/zktls) - How it works
- [API Key Guide](https://docs.reclaimprotocol.org/api-key) - Setup instructions

### Solana Development
- [Solana Documentation](https://docs.solana.com/) - Official Solana docs
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - JavaScript SDK
- [Solana Program Library](https://spl.solana.com/) - Token standards
- [Reown AppKit for Solana](https://docs.reown.com/appkit/overview) - Wallet integration

### Next.js & React
- [Next.js 15 Documentation](https://nextjs.org/docs) - Framework documentation
- [React 19 Documentation](https://react.dev/) - React library
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety

### Project Documentation
- [Main README](../README.md) - Project overview and architecture
- [ZKTLS Integration Guide](./docs/ZKTLS_INTEGRATION.md) - zkTLS setup details
- [Contracts README](../contracts/README.md) - Solana smart contracts

### Community & Support
- [Noir Discord](https://discord.gg/noir) - ZK circuit development
- [Solana Stack Exchange](https://solana.stackexchange.com/) - Developer Q&A
- [Reclaim Protocol Telegram](https://t.me/reclaimprotocol) - zkTLS support
- [Reown Dashboard](https://dashboard.reown.com) - Wallet integration support

---

**Built for Solana Privacy Hackathon 🔐 (Jan 12 - Feb 1, 2026)**

