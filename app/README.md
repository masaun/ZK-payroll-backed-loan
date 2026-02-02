# ZK Payroll-Backed Loan - Frontend Application


## 🛠️ Technology Stack
- **Noir ZK circuit**: **`bb.js`** (`v3.0.0-devnet.6-patch.1`) and **`@noir-lang/noir_js`** (`v1.0.0-beta.18`) - Proving backend for Noir circuits. In this project, this is used for the `off-chain` verificaton on client-side as well.
- **zkTLS**: Reclaim Protocol JS SDK
- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Solana (via Reown AppKit)
- **Wallet**: Reown AppKit with Solana adapter

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

### Noir ZK circuit
- [Noir Language Documentation](https://noir-lang.org/) - ZK circuit programming language
- [Aztec Documentation](https://docs.aztec.network/) - Proving backend

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


