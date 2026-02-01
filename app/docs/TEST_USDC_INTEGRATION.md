# Test USDC Token Integration for Lending & Borrowing

## Overview
This document describes the integration of the Test USDC Token into the ZK Payroll Backed Loan application's lending and borrowing functionality.

## Integration Summary

### 1. Configuration Updates

#### Added to `/app/src/config/index.ts`:
- `PROGRAM_IDS.testUsdc` - Test USDC program ID
- `TOKEN_MINTS.testUsdc` - Test USDC mint address
- `TOKEN_PROGRAM_ID` - SPL Token Program ID
- `ASSOCIATED_TOKEN_PROGRAM_ID` - Associated Token Program ID

#### Environment Variables (`.env.example`):
```env
NEXT_PUBLIC_TEST_USDC_PROGRAM_ID=41NBEbnBWvQTLs6TRKCDWH88rJTpdFUvq5WA3zpQGYfY
NEXT_PUBLIC_TEST_USDC_MINT=BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc
```

### 2. Contract Helper Functions

#### Added to `/app/src/lib/contracts.ts`:
- `getTokenProgramId()` - Returns SPL Token Program ID
- `getAssociatedTokenProgramId()` - Returns Associated Token Program ID
- `deriveAssociatedTokenAddress(owner, mint)` - Derives associated token account address for a user

### 3. Lending Functionality (Depositing Test USDC)

#### Updated `/app/src/hooks/useLending.ts`:

**deposit() function:**
- Accepts optional `tokenMint` parameter (defaults to Test USDC)
- Derives depositor PDA for tracking deposits
- Derives pool vault PDA where tokens are stored
- Derives depositor's associated token account
- Builds and sends `deposit_into_lending_pool` instruction
- Transfers Test USDC from depositor to pool vault
- Amount is converted to 6 decimals (USDC standard)

**withdraw() function:**
- Accepts optional `tokenMint` parameter (defaults to Test USDC)
- Derives necessary PDAs (depositor, pool vault)
- Builds and sends `withdraw_from_lending_pool` instruction
- Transfers Test USDC from pool vault back to depositor

#### Updated `/app/src/app/lend/page.tsx`:
- Changed display from "USDC" to "Test USDC" throughout
- Pool now shows "Test USDC" as the lending asset
- Deposit/withdraw modals display "Test USDC"
- Passes `TOKEN_MINTS.testUsdc` to lending hook functions

### 4. Borrowing Functionality (Receiving Test USDC Loan)

#### Updated `/app/src/hooks/useBorrowing.ts`:

**borrow() function:**
- Accepts optional `tokenMint` parameter (defaults to Test USDC)
- Derives borrower PDA for tracking loan state
- Derives lending pool vault PDA (where Test USDC is stored)
- Derives borrower's associated token account (where loan funds go)
- Builds and sends `request_loan` instruction to borrowing program
- Borrowing program calls lending program via CPI (Cross-Program Invocation)
- Lending program transfers Test USDC from pool vault to borrower
- Amount is converted to 6 decimals (USDC standard)

#### Updated `/app/src/app/borrow/page.tsx`:
- Passes `TOKEN_MINTS.testUsdc` to borrowing hook
- Updated success message to show "Test USDC"
- Loan approval flow:
  1. ✅ Retrieve payroll proof via zkTLS (Reclaim Protocol)
  2. ✅ Generate ZK Payroll Backed Loan Proof
  3. ✅ Verify ZK proof
  4. ✅ Transfer Test USDC from lending pool to borrower (when proof is valid)

## Flow Diagram

### Lending Flow (Depositing Test USDC)
```
┌─────────────┐
│   Lender    │
└──────┬──────┘
       │ 1. Click "Lend Now"
       │ 2. Enter amount (e.g., 1000 Test USDC)
       │ 3. Approve transaction
       ▼
┌──────────────────────────────────┐
│  deposit() in useLending.ts      │
│  - Derive depositor PDA          │
│  - Derive pool vault PDA         │
│  - Get depositor token account   │
│  - Build deposit instruction     │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Lending Program (On-chain)      │
│  - Verify signer                 │
│  - Transfer Test USDC to vault   │
│  - Update depositor account      │
│  - Track deposit amount & time   │
└──────────────────────────────────┘
```

### Borrowing Flow (Receiving Test USDC Loan)
```
┌─────────────┐
│  Borrower   │
└──────┬──────┘
       │ 1. Click "Borrow"
       │ 2. Enter loan amount
       ▼
┌──────────────────────────────────┐
│  Step 1: zkTLS Payroll Proof     │
│  - Connect to employer portal    │
│  - Retrieve payroll data         │
│  - Generate zkTLS proof          │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Step 2: ZK Proof Generation     │
│  - Input: payroll amount         │
│  - Input: loan amount requested  │
│  - Generate Noir ZK proof        │
│  - Prove: loan ≤ 2x payroll      │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Step 3: ZK Proof Verification   │
│  - Verify proof on-chain         │
│  - Check public inputs           │
└──────────────┬───────────────────┘
               │ ✅ Proof Valid
               ▼
┌──────────────────────────────────┐
│  Step 4: Transfer Test USDC      │
│  borrow() in useBorrowing.ts     │
│  - Derive borrower PDA           │
│  - Derive pool vault PDA         │
│  - Get borrower token account    │
│  - Build request_loan instruction│
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Borrowing Program (On-chain)    │
│  - Verify ZK proof valid         │
│  - Call lending program via CPI  │
└──────────────┬───────────────────┘
               │ CPI Call
               ▼
┌──────────────────────────────────┐
│  Lending Program (On-chain)      │
│  - Transfer Test USDC from vault │
│  - Send to borrower token account│
│  - Update pool statistics        │
│  - Record loan in borrower PDA   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Borrower receives Test USDC! 🎉 │
└──────────────────────────────────┘
```

## Key Technical Details

### Token Decimals
- Test USDC uses 6 decimals (matching real USDC)
- UI amounts are multiplied by 1e6 before sending to contract
- Contract amounts are divided by 1e6 before displaying in UI

### PDAs (Program Derived Addresses)
1. **Depositor PDA**: `[b"depositor", depositor_pubkey, lending_pool_pubkey]`
2. **Borrower PDA**: `[b"borrower", borrower_pubkey, collateral_pool_pubkey]`
3. **Pool Vault PDA**: `[b"vault", pool_pubkey, mint_pubkey]`

### Instruction Discriminators
- `deposit_into_lending_pool`: `[3, 250, 204, 232, 7, 192, 142, 181]`
- `withdraw_from_lending_pool`: `[183, 18, 70, 156, 148, 109, 161, 34]`
- `request_loan` (borrowing): `[157, 223, 146, 134, 233, 120, 218, 108]`

## Testing the Integration

### Prerequisites
1. Wallet with SOL on Solana Devnet (for transaction fees)
2. Test USDC tokens (minted to admin wallet)

### Testing Deposit
1. Open the Lend page
2. Connect wallet
3. Click "Lend Now"
4. Enter amount (e.g., 100)
5. Confirm transaction
6. Verify Test USDC transferred from wallet to pool vault

### Testing Borrow
1. Open the Borrow page
2. Connect wallet
3. Click "Borrow Now"
4. Enter loan amount
5. Wait for ZK proof generation
6. Confirm transaction when proof is verified
7. Verify Test USDC transferred from pool vault to wallet

## Files Modified

### Configuration
- `/app/src/config/index.ts` - Added Test USDC constants
- `/app/.env.example` - Added Test USDC environment variables

### Contracts & Utilities
- `/app/src/lib/contracts.ts` - Added token helper functions

### Hooks
- `/app/src/hooks/useLending.ts` - Implemented Test USDC deposits/withdrawals
- `/app/src/hooks/useBorrowing.ts` - Implemented Test USDC loan transfers

### UI Pages
- `/app/src/app/lend/page.tsx` - Updated for Test USDC display
- `/app/src/app/borrow/page.tsx` - Updated for Test USDC loans

## Next Steps

1. **Initialize Lending Pool**: Create lending pool with Test USDC support
2. **Test Deposits**: Verify lenders can deposit Test USDC
3. **Test Loans**: Verify borrowers can receive Test USDC after ZK proof validation
4. **Add Balance Checking**: Display user's Test USDC balance
5. **Add APY Calculations**: Show real interest rates based on pool utilization
6. **Production Deployment**: Switch from Test USDC to real USDC on mainnet

## Security Considerations

- ✅ PDA derivation ensures unique accounts per user
- ✅ ZK proof verification happens before fund transfer
- ✅ SPL Token program handles all token transfers
- ✅ Cross-program invocation (CPI) ensures atomic transactions
- ⚠️  Test only with Test USDC on Devnet
- ⚠️  Audit contracts before mainnet deployment

## Support

For questions or issues:
- Check the contract deployment status: See `/contracts/TEST_USDC_DEPLOYMENT.md`
- Review the integration summary: This document
- Check transaction logs in browser console
- Verify wallet connection and Test USDC balance
