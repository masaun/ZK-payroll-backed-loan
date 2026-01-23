# Payroll-Backed Loan - Solana + zkTLS Demo

A Next.js application demonstrating privacy-preserving payroll verification using **Reclaim Protocol's zkTLS technology** on Solana.

## 🌟 Features

- 🔐 **zkTLS Proof Generation**: Verify payroll data without sharing credentials
- 💎 **Solana Integration**: Connect with Solana wallets using Reown AppKit
- 🎨 **Modern UI**: Beautiful Next.js 15 + React 19 interface
- 🛡️ **Secure Backend**: Server-side proof verification
- 📱 **Multiple Verification Methods**: QR code, browser extension, or mobile app

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Solana Wallet (Reown AppKit)

1. Go to [Reown Dashboard](https://dashboard.reown.com) and create a new project
2. Copy your `Project ID`
3. It's already configured in the code, but you can update it if needed

### 3. Configure zkTLS (Reclaim Protocol)

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your Reclaim credentials
# Get them from: https://dev.reclaimprotocol.org/
```

Required variables:
- `RECLAIM_APP_ID`: Your Reclaim application ID
- `RECLAIM_APP_SECRET`: Your Reclaim application secret
- `RECLAIM_PROVIDER_ID`: Provider ID for payroll verification

### 4. Verify Setup

```bash
./verify-setup.sh
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── api/reclaim/              # zkTLS API routes
│   │   ├── page.tsx                  # Main page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ZkTlsButton.tsx          # zkTLS proof generation button
│   │   ├── ActionButtonList.tsx      # Wallet actions
│   │   └── ConnectButton.tsx
│   ├── hooks/
│   │   └── useZkTlsProof.ts         # zkTLS integration hook
│   ├── lib/
│   │   └── zktls/                    # Reclaim SDK integration
│   └── config/
│       └── index.ts                  # Solana configuration
├── .env.local.example                # Environment template
├── setup-zktls.sh                    # Setup script
├── verify-setup.sh                   # Verification script
├── ZKTLS_INTEGRATION.md             # Detailed integration guide
├── INTEGRATION_SUMMARY.md            # Implementation summary
└── QUICK_REFERENCE.md               # Quick reference guide
```

## 🔐 How It Works

1. **Connect Wallet**: User connects their Solana wallet
2. **Request Proof** (CLIENT-SIDE): User clicks "Request zkTLS Proof Generation"
3. **Create Request** (CLIENT-SIDE): Proof request is created directly in the browser
4. **Verify Identity**: User scans QR code and authenticates with payroll provider
5. **Generate Proof**: zkTLS proof is generated securely
6. **Verify Proof** (SERVER-SIDE): Backend verifies the proof cryptographically
7. **Display Data**: Verified payroll data is displayed

**Architecture:**
- **Client-Side**: Proof request creation & generation (using `useZkTlsProof` hook)
- **Server-Side**: Proof verification only (for security)

## 📚 Documentation

- **[ZKTLS_INTEGRATION.md](./ZKTLS_INTEGRATION.md)**: Comprehensive integration guide
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)**: What was implemented
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: Quick reference card

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Solana (via Reown AppKit)
- **zkTLS**: Reclaim Protocol JS SDK
- **Wallet**: Reown AppKit with Solana adapter

## 📖 Usage Example

### Using the zkTLS Button Component

```tsx
import { ZkTlsButton } from '@/components/ZkTlsButton';

export default function Page() {
  return (
    <div>
      <h1>Verify Your Payroll</h1>
      <ZkTlsButton />
    </div>
  );
}
```

### Using the zkTLS Hook

```tsx
import { useZkTlsProof } from '@/hooks/useZkTlsProof';

function MyComponent() {
  const { isGenerating, error, proofData, requestProof } = useZkTlsProof();
  
  return (
    <button onClick={() => requestProof(walletAddress)}>
      {isGenerating ? 'Generating...' : 'Verify Payroll'}
    </button>
  );
}
```

## 🔒 Security

- Server-side proof verification
- Environment variables for sensitive credentials
- No credential sharing with third parties
- Cryptographic proof validation

## 🐛 Troubleshooting

Run the verification script:
```bash
./verify-setup.sh
```

Common issues:
- **Missing credentials**: Add them to `.env.local`
- **Server won't start**: Restart after adding env variables
- **Proof fails**: Check provider ID is correct

## 📚 Resources

- [Reclaim Protocol Docs](https://docs.reclaimprotocol.org/)
- [Reclaim DevTool](https://dev.reclaimprotocol.org/)
- [Reown AppKit Docs](https://docs.reown.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Solana Docs](https://docs.solana.com/)

## 🆘 Support

- **Reclaim Protocol**: [Telegram Support](https://t.me/protocolreclaim)
- **Reown AppKit**: [Dashboard](https://dashboard.reown.com)

## 📝 License

Same as parent project.

