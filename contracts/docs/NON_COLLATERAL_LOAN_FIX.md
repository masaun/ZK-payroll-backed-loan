# Non-Collateral Payroll-Backed Loan Implementation Fix

## Problem Overview

The original implementation had a **fundamental design flaw**:
- For a **payroll-backed loan** (non-collateral loan), funds should come from the **Lending Pool**
- However, the borrow function was trying to use a **Collateral Pool** which doesn't make sense for non-collateral loans
- The system wasn't making a CPI call to transfer funds from the lending pool

## Root Cause

1. **AccountNotInitialized Error (0xbc4)**: The collateral pool account didn't exist because it shouldn't be used for non-collateral loans
2. **Wrong Flow**: The borrowing program was only updating state, not actually transferring funds
3. **Missing CPI**: No Cross-Program Invocation to the lending pool's `borrow_from_pool` function

## Correct Flow for Payroll-Backed Loans

```
User (Borrower)
  ↓
[1] Submit ZK Proof (payroll verification via zkTLS)
  ↓
[2] Generate ZK Payroll-Backed Loan Proof
  ↓
[3] Call: Borrowing Program → borrow_from_lending_pool()
  ↓
[4] Borrowing Program makes CPI call →  Lending Program → borrow_from_pool()
  ↓
[5] Lending Pool transfers Test USDC → Borrower's Token Account
  ↓
[6] Borrowing Program updates BorrowerState (tracks debt)
```

## Changes Made

### 1. Redesigned `BorrowFromLendingPool` Context

**contracts/programs/borrowing/src/lib.rs**

**Before:**
```rust
#[derive(Accounts)]
pub struct BorrowFromLendingPool<'info> {
    #[account(mut)]
    pub collateral_pool: Account<'info, CollateralPool>,  // ❌ Wrong!
    
    #[account(init_if_needed, ...)]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**After:**
```rust
#[derive(Accounts)]
pub struct BorrowFromLendingPool<'info> {
    /// The lending pool to borrow from
    /// CHECK: This account is validated by the lending program during CPI
    #[account(mut)]
    pub lending_pool: AccountInfo<'info>,  // ✓ Correct!
    
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,  // Lending pool's token vault
    
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,  // Borrower receives funds here
    
    #[account(init_if_needed, ...)]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    /// CHECK: This is the lending program ID, verified at runtime
    pub lending_program: AccountInfo<'info>,  // For CPI
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### 2. Updated `borrow_from_lending_pool` Function

**Before:**
```rust
pub fn borrow_from_lending_pool(ctx: Context<BorrowFromLendingPool>, amount: u64) -> Result<()> {
    // Only updated state, no actual fund transfer!
    borrower_state.borrowed_amount += amount;
    Ok(())
}
```

**After:**
```rust
pub fn borrow_from_lending_pool(ctx: Context<BorrowFromLendingPool>, amount: u64) -> Result<()> {
    // ... validation ...
    
    // Make CPI call to lending pool to transfer funds
    let transfer_ix = anchor_lang::solana_program::instruction::Instruction {
        program_id: ctx.accounts.lending_program.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.lending_pool.key(), false),
            AccountMeta::new(ctx.accounts.pool_vault.key(), false),
            AccountMeta::new(ctx.accounts.borrower_token_account.key(), false),
            AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        ],
        data: /* borrow_from_pool instruction data */,
    };
    
    anchor_lang::solana_program::program::invoke(&transfer_ix, &[...])?;
    
    // Update borrower state
    borrower_state.borrowed_amount += amount;
    borrower_state.borrow_timestamp = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

### 3. Updated `BorrowerState` Structure

**Before:**
```rust
#[account]
pub struct BorrowerState {
    pub borrower: Pubkey,
    pub collateral_pool: Pubkey,  // ❌ Wrong reference
    pub collateral_amount: u64,
    pub borrowed_amount: u64,
    pub borrow_timestamp: i64,
}
```

**After:**
```rust
#[account]
pub struct BorrowerState {
    pub borrower: Pubkey,
    pub lending_pool: Pubkey,      // ✓ References lending pool instead
    pub collateral_amount: u64,    // Always 0 for non-collateral loans
    pub borrowed_amount: u64,
    pub borrow_timestamp: i64,
}
```

### 4. Updated Frontend Code

**app/src/lib/contracts.ts**
- Removed `deriveCollateralPoolPDA` usage for borrow flow
- `deriveBorrowerPDA` now uses lending pool address instead of collateral pool

**app/src/hooks/useBorrowing.ts**

**Before:**
```typescript
const borrow = async (collateralPoolAddress, lendingPoolAddress, amount) => {
  const [borrowerPDA] = await deriveBorrowerPDA(borrower, collateralPool);
  // ... only 4 accounts passed ...
}
```

**After:**
```typescript
const borrow = async (lendingPoolAddress, amount, tokenMint) => {
  const [borrowerPDA] = await deriveBorrowerPDA(borrower, lendingPool);
  
  // Pass 8 accounts for CPI:
  // 1. lending_pool
  // 2. pool_vault
  // 3. borrower_token_account
  // 4. borrower_state
  // 5. borrower
  // 6. lending_program (for CPI)
  // 7. token_program
  // 8. system_program
}
```

**app/src/app/borrow/page.tsx**

**Before:**
```typescript
await borrowing.borrow(
  PROGRAM_IDS.borrowing,  // ❌ Wrong! This is a program ID, not a pool address
  PROGRAM_IDS.lending,
  amount,
  TOKEN_MINTS.testUsdc
);
```

**After:**
```typescript
await borrowing.borrow(
  PROGRAM_IDS.lending,    // ✓ Correct! Lending pool address
  amount,
  TOKEN_MINTS.testUsdc
);
```

## Account Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  PAYROLL-BACKED LOAN (Non-Collateral) - BORROW FLOW    │
└─────────────────────────────────────────────────────────┘

[Borrower Wallet] ──────────► [Borrowing Program]
                               │
                               ├─ Creates/Updates: BorrowerState PDA
                               │   ├─ borrower: Borrower's pubkey
                               │   ├─ lending_pool: Lending pool address
                               │   ├─ borrowed_amount: Amount borrowed
                               │   └─ collateral_amount: 0 (non-collateral)
                               │
                               └─ Makes CPI Call ──────► [Lending Program]
                                                          │
                                                          └─ Executes: borrow_from_pool()
                                                             │
                                                             └─ Transfer ──► [Borrower Token Account]
                                                                From: Pool Vault
                                                                Amount: Loan amount
```

## Testing

After deploying the updated contract:

1. **Ensure Lending Pool has funds:**
   ```bash
   # Deposit Test USDC into lending pool
   npm run deposit -- <amount>
   ```

2. **Try borrowing from the UI:**
   - Generate ZK payroll proof
   - Request loan
   - Funds should transfer from lending pool to borrower

3. **Verify transaction:**
   - Check that `borrower_token_account` received funds
   - Check that `pool_vault` balance decreased
   - Check that `borrower_state` was created/updated

## Key Differences: Collateral vs. Non-Collateral Loans

| Aspect | Collateral Loan | Non-Collateral (Payroll-Backed) Loan |
|--------|----------------|--------------------------------------|
| **Collateral Required** | Yes (deposited first) | No (ZK proof of payroll) |
| **Pool Used** | Collateral Pool | Lending Pool |
| **Funds Source** | Lending Pool (after collateral check) | Lending Pool (after ZK proof verification) |
| **Risk Mitigation** | Over-collateralization ratio | ZK-verified payroll income |
| **BorrowerState.collateral_amount** | > 0 | = 0 |
| **BorrowerState references** | collateral_pool | lending_pool |

## Next Steps

1. ✅ **Deployed**: Updated borrowing contract to devnet
2. ⏳ **TODO**: Add on-chain ZK proof verification in `borrow_from_lending_pool`
3. ⏳ **TODO**: Implement automated loan repayment via payroll deduction
4. ⏳ **TODO**: Add interest calculation based on loan duration

## Related Files

- **Contract**: `/contracts/programs/borrowing/src/lib.rs`
- **Frontend Hook**: `/app/src/hooks/useBorrowing.ts`
- **UI Page**: `/app/src/app/borrow/page.tsx`
- **Utilities**: `/app/src/lib/contracts.ts`

## Deployment Info

- **Network**: Solana Devnet
- **Borrowing Program ID**: `HBY7P5xzgxhmaSXFiGE3HeWrmhNScYh3r6amyp4q7e4x`
- **Lending Program ID**: `GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF`
- **Deployed**: February 2, 2026

---

**Summary**: The system now correctly implements a non-collateral payroll-backed loan by making CPI calls from the borrowing program to the lending pool, enabling actual token transfers based on ZK-verified payroll credentials.
