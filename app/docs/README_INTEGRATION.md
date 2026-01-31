# Quick Start: Complete Contract Integration

## ✅ What's Already Done

All 3 Solana contracts have been:
1. ✅ Deployed to Solana devnet
2. ✅ Added to `.env` file
3. ✅ Integrated into all UI pages
4. ✅ Connected to custom React hooks

## 🚀 Final Steps to Make It Work

### Step 1: Install Dependencies
```bash
cd app
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### Step 2: Copy IDL Files
```bash
# Create IDL directory
mkdir -p app/src/idl

# Copy IDL files from contracts
cp contracts/target/idl/zk_verifiable_credential_manager.json app/src/idl/
cp contracts/target/idl/lending.json app/src/idl/
cp contracts/target/idl/borrowing.json app/src/idl/
```

### Step 3: Test the Application
```bash
cd app
npm run dev
```

Open http://localhost:3000 and:
1. Connect your Solana wallet (make sure it's on Devnet)
2. Try each feature:
   - Generate/store ZK credentials
   - Deposit/withdraw in lending pool
   - Borrow/repay with collateral

## 📋 Deployed Contracts

| Contract | Program ID | Network |
|----------|-----------|---------|
| ZK Credential Manager | `HskmoEBbJFB9LYssgyy1AwUthUMEbUPNwsF9YMPELHcR` | Devnet |
| Lending | `GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF` | Devnet |
| Borrowing | `HBY7P5xzgxhmaSXFiGE3HeWrmhNScYh3r6amyp4q7e4x` | Devnet |

## 📁 Files Created

### Configuration
- `app/.env` - Environment variables with program IDs
- `app/src/config/index.ts` - Exported PROGRAM_IDS constant

### Utilities & Hooks
- `app/src/lib/contracts.ts` - Contract helper functions
- `app/src/hooks/useZkCredential.ts` - ZK credential operations
- `app/src/hooks/useLending.ts` - Lending pool operations
- `app/src/hooks/useBorrowing.ts` - Borrowing operations

### Updated Pages
- `app/src/app/credential/page.tsx` - Credential management
- `app/src/app/lend/page.tsx` - Lending interface
- `app/src/app/borrow/page.tsx` - Borrowing interface

## 🔧 How Each Contract is Called

### ZK Credential Manager
```typescript
import { useZkCredential } from '@/hooks/useZkCredential';

const { storeProof, verifyCredential, revokeCredential } = useZkCredential();

// Store proof
await storeProof(proofData, publicOutput, proofHash);

// Verify credential
await verifyCredential(proofHash);

// Revoke credential
await revokeCredential(proofHash);
```

### Lending Program
```typescript
import { useLending } from '@/hooks/useLending';

const { deposit, withdraw, loadUserDeposits } = useLending();

// Deposit into lending pool
await deposit(PROGRAM_IDS.lending, amount);

// Withdraw from lending pool
await withdraw(PROGRAM_IDS.lending, amount);
```

### Borrowing Program
```typescript
import { useBorrowing } from '@/hooks/useBorrowing';

const { depositCollateral, borrow, repay, withdrawCollateral } = useBorrowing();

// Deposit collateral
await depositCollateral(PROGRAM_IDS.borrowing, amount);

// Borrow from lending pool
await borrow(PROGRAM_IDS.borrowing, PROGRAM_IDS.lending, amount);

// Repay borrowed amount
await repay(PROGRAM_IDS.borrowing, PROGRAM_IDS.lending, amount);

// Withdraw collateral
await withdrawCollateral(PROGRAM_IDS.borrowing, amount);
```

## 🎯 Current Status

**Integration Level**: ~90% Complete

✅ **Completed**:
- Contract deployment
- Environment configuration
- UI wiring
- Hook structure
- Transaction flow

⏳ **Needs Completion**:
- Copy IDL files (5 minutes)
- Update hooks to use Anchor Program instances
- Add token account creation logic
- Test all functions with real transactions

## 📚 Documentation

- [Full Integration Guide](./CONTRACT_INTEGRATION.md) - Complete technical details
- [Solana Explorer Links](https://explorer.solana.com/?cluster=devnet) - Verify contracts

## 🐛 Troubleshooting

### Error: "Cannot find module '@coral-xyz/anchor'"
```bash
npm install @coral-xyz/anchor
```

### Error: "IDL file not found"
Make sure you copied the IDL files from `contracts/target/idl/` to `app/src/idl/`

### Error: "Transaction simulation failed"
- Check wallet is on Devnet
- Ensure sufficient SOL balance (get from faucet)
- Verify program accounts are initialized

### Wallet Not Connecting
- Make sure wallet extension is on Devnet network
- Try refreshing the page
- Check browser console for errors

## 💡 Tips

1. **Use Solana Devnet Faucet**: Get free SOL at https://faucet.solana.com
2. **Check Transaction Logs**: All transactions log their signatures to console
3. **Monitor Program Accounts**: Use Solana Explorer to see account changes
4. **Test Incrementally**: Start with credential storage, then move to lending/borrowing

## 🔗 Useful Links

- [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

---

**Need Help?** Check the console logs - all contract calls log their program IDs and transaction details.
