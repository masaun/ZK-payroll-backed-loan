# Lending Pool Initialization Guide

## Overview
The lending pool has been successfully initialized on Solana Devnet. Users can now deposit Test USDC to earn interest.

## Lending Pool Details

### Program Information
- **Lending Program ID**: `GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF`
- **Test USDC Mint**: `BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc`

### Deployed Addresses
- **Lending Pool PDA**: `BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J`
  - Seeds: `["lending_pool", TEST_USDC_MINT]`
  - Bump: 255
- **Pool Vault**: `2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo`
  - Associated token account owned by the lending pool PDA

### Pool Configuration
- **Interest Rate**: 5% APR (500 basis points)
- **Minimum Deposit**: 1 Test USDC (1,000,000 with 6 decimals)
- **Status**: ✅ **Initialized and Ready**

### Initialization Transaction
- **Transaction Signature**: `2od8M9NkgTPL2e56bjCZDfx28qSgedxzfx33YRU4fyzATigS1dKs4Md6mtC1q3gkh95uKWyNzwH1tw6M6DBZyMpF`
- **Explorer**: [View on Solana Explorer](https://explorer.solana.com/tx/2od8M9NkgTPL2e56bjCZDfx28qSgedxzfx33YRU4fyzATigS1dKs4Md6mtC1q3gkh95uKWyNzwH1tw6M6DBZyMpF?cluster=devnet)

## How to Use

### Depositing Test USDC

1. **Navigate to Lend Page**
   ```
   http://localhost:3000/lend
   ```

2. **Connect Your Wallet**
   - Click "Connect Wallet" button
   - Select your Solana wallet (Phantom, Solflare, etc.)
   - Approve the connection

3. **Deposit Test USDC**
   - Click the **"Lend Now"** button
   - Enter the amount of Test USDC you want to deposit (minimum 1 Test USDC)
   - Approve the transaction in your wallet
   - Wait for confirmation

4. **Track Your Deposits**
   - View your deposited amount in the "Your Lending Positions" section
   - Monitor earned interest over time

## Re-initialization (If Needed)

If you need to re-initialize the pool (e.g., on a different cluster or with different parameters):

```bash
cd contracts
node scripts/init-lending-pool.js
```

The script will:
1. Check if the pool vault exists, create it if not
2. Initialize the lending pool with configured parameters
3. Output the pool address and transaction details

## Verification

Verify the pool on Solana Explorer:
- [Lending Pool Account](https://explorer.solana.com/address/BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J?cluster=devnet)
- [Pool Vault Account](https://explorer.solana.com/address/2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo?cluster=devnet)

Or using CLI:
```bash
solana account BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J --url devnet
```

## What You Can Do Now

1. ✅ **Deposit Test USDC** - Lenders can supply Test USDC to earn 5% APR
2. ✅ **Borrow** - Borrowers with valid ZK payroll proofs can request loans  
3. ✅ **Withdraw** - Lenders can withdraw their deposits + earned interest

## Technical Details

### Account Structure
```rust
pub struct LendingPool {
    pub authority: Pubkey,          // Pool creator
    pub token_mint: Pubkey,          // Test USDC mint
    pub pool_vault: Pubkey,          // Token account holding deposits
    pub total_deposits: u64,         // Total Test USDC deposited
    pub total_borrowed: u64,         // Total Test USDC borrowed
    pub interest_rate: u64,          // 500 (5%)
    pub min_deposit: u64,            // 1_000_000 (1 Test USDC)
    pub bump: u8,                    // PDA bump seed (255)
}
```

### Instruction Discriminator
The `initialize_lending_pool` instruction uses discriminator:
```
[236, 76, 136, 68, 196, 14, 9, 177]
```

This is derived from the SHA256 hash of `"global:initialize_lending_pool"`.

## Troubleshooting

### "Account Owned By Wrong Program" Error
**Cause**: The lending pool hasn't been initialized yet.

**Solution**: Run the initialization script:
```bash
cd contracts
node scripts/init-lending-pool.js
```

### "Account Not Initialized" Error  
**Cause**: The pool vault (associated token account) doesn't exist.

**Solution**: The script automatically creates the vault before initializing the pool.

### "Already in Use" Error
**Cause**: The lending pool has already been initialized.

**Solution**: This is expected! You can proceed directly to depositing. The pool is ready to use.

## Related Files

- Initialization Script: `/contracts/scripts/init-lending-pool.js`
- Lending Contract: `/contracts/programs/lending/src/lib.rs`
- IDL (with discriminators): `/contracts/target/idl/lending.json`
- UI Hooks: `/app/src/hooks/useLending.ts`
- Lend Page: `/app/src/app/lend/page.tsx`
- Config: `/app/.env` (contains pool address)
