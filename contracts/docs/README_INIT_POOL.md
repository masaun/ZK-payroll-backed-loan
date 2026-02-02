# Lending Pool Initialization Script

## Overview
This script initializes the Test USDC lending pool on Solana Devnet.

## Prerequisites
- Node.js installed
- Deployer wallet funded with SOL (at least 0.01 SOL for transaction fees)
- `.env` file configured with:
  - `LENDING_PROGRAM_ID`
  - `TEST_USDC_MINT`
  - `ANCHOR_WALLET` (path to deployer keypair)
  - `ANCHOR_PROVIDER_URL` (Solana RPC endpoint)

## Usage

```bash
cd contracts
node scripts/init-lending-pool.js
```

## What It Does

1. **Loads Configuration**
   - Reads lending program ID and Test USDC mint from `.env`
   - Loads deployer wallet from keypair file
   - Connects to Solana Devnet

2. **Derives Addresses**
   - Calculates lending pool PDA using seeds: `["lending_pool", TEST_USDC_MINT]`
   - Derives pool vault (associated token account) address

3. **Creates Pool Vault**
   - Checks if vault exists
   - If not, creates an associated token account owned by the lending pool PDA
   - This account will hold all deposited Test USDC

4. **Initializes Pool**
   - Sends `initialize_lending_pool` instruction
   - Sets interest rate to 5% APR (500 basis points)
   - Sets minimum deposit to 1 Test USDC (1,000,000 with 6 decimals)
   - Creates the pool account on-chain

5. **Outputs Results**
   - Transaction signature
   - Pool PDA address
   - Pool vault address
   - Links to Solana Explorer

## Expected Output

```
🚀 Initializing Test USDC Lending Pool on Devnet

Authority: 6XYxBpW7VkQSjfvbg39JrzengXeHzwS6WpJuLQPzpp9U
Wallet balance: 5.23527796 SOL

Test USDC Mint: BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc
Lending Program ID: GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF

Lending Pool PDA: BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J
Bump: 255

Pool Vault: 2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo

Creating pool vault (associated token account)...
✅ Pool vault created: 5Qv4bF1VEhJojbVhmENUaGaHvA4TuVRWV3ksPasUwn2hNLnBGB9QaEroUCnEtLB7d9qRaLwWWV9oGTdDemzNtzaa

Initializing lending pool...
  Interest Rate: 5 %
  Min Deposit: 1 Test USDC

Transaction sent: 2od8M9NkgTPL2e56bjCZDfx28qSgedxzfx33YRU4fyzATigS1dKs4Md6mtC1q3gkh95uKWyNzwH1tw6M6DBZyMpF
Confirming...

✅ Lending pool initialized successfully!

Summary:
========
Transaction: 2od8M9NkgTPL2e56bjCZDfx28qSgedxzfx33YRU4fyzATigS1dKs4Md6mtC1q3gkh95uKWyNzwH1tw6M6DBZyMpF
Lending Pool PDA: BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J
Pool Vault: 2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo
Token Mint: BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc
Interest Rate: 5 %
Min Deposit: 1 Test USDC

🎉 You can now deposit Test USDC into the lending pool!

View on Solana Explorer:
https://explorer.solana.com/tx/2od8M9NkgTPL2e56bjCZDfx28qSgedxzfx33YRU4fyzATigS1dKs4Md6mtC1q3gkh95uKWyNzwH1tw6M6DBZyMpF?cluster=devnet
https://explorer.solana.com/address/BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J?cluster=devnet
```

## Error Handling

### "Insufficient balance"
Ensure your deployer wallet has at least 0.01 SOL for transaction fees.

```bash
solana airdrop 1 <YOUR_WALLET_ADDRESS> --url devnet
```

### "Account already in use"
The pool has already been initialized. This is expected if running the script multiple times.

### "Account not initialized" (pool_vault)
The script automatically creates the vault if it doesn't exist. If this error persists, check that the Test USDC mint is valid.

## Verification

After successful initialization, verify on Solana Explorer:

- **Pool Account**: https://explorer.solana.com/address/BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J?cluster=devnet
- **Vault Account**: https://explorer.solana.com/address/2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo?cluster=devnet

Or using Solana CLI:

```bash
# Check pool account
solana account BxGTDU39uymhYs987xZmEqe4G1Pgwt4F6fZQ3FfLPz5J --url devnet

# Check vault account  
solana account 2FJnoKoepSNBntzp6UQzSjL24gwzAcoZzzzbc8AevGbo --url devnet
```

## Next Steps

After initialization:

1. Navigate to the Lend page in your app: http://localhost:3000/lend
2. Connect your wallet
3. Deposit Test USDC to start earning 5% APR
4. Withdraw your deposits + interest anytime

## Technical Details

### Instruction Discriminator
The script uses the correct discriminator from the IDL:
```javascript
[236, 76, 136, 68, 196, 14, 9, 177]
```

This corresponds to the `initialize_lending_pool` instruction.

### PDA Derivation
```javascript
const [lendingPoolPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("lending_pool"), testUsdcMint.toBuffer()],
  lendingProgramId
);
```

### Instruction Accounts
1. `lending_pool` - PDA to be initialized (writable)
2. `token_mint` - Test USDC mint (read-only)
3. `pool_vault` - Associated token account for the PDA (read-only, must exist)
4. `authority` - Transaction signer (writable, signer)
5. `system_program` - System program (read-only)

## Related Files

- Script: `/contracts/scripts/init-lending-pool.js`
- Contract: `/contracts/programs/lending/src/lib.rs`
- IDL: `/contracts/target/idl/lending.json`
- Documentation: `/app/docs/LENDING_POOL_INITIALIZATION.md`
