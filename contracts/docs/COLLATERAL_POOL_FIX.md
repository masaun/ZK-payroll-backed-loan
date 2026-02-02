# Collateral Pool Initialization Fix

## Problem

The borrow function was failing with error:
```
AnchorError caused by account: collateral_pool. 
Error Code: AccountOwnedByWrongProgram. Error Number: 3007. 
Error Message: The given account is owned by a different program than expected.
```

## Root Cause

The frontend was passing the **borrowing program ID** instead of the **collateral pool PDA** to the borrow function. The collateral pool must be a PDA (Program Derived Address) owned by the borrowing program, derived with seeds:
```
[b"collateral_pool", collateral_mint.key().as_ref()]
```

## Changes Made

### 1. Added `deriveCollateralPoolPDA` Function
**File:** `app/src/lib/contracts.ts`

Added a new utility function to derive the collateral pool PDA:
```typescript
export async function deriveCollateralPoolPDA(
  collateralMint: PublicKey
): Promise<[PublicKey, number]> {
  const programId = getBorrowingProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from('collateral_pool'), collateralMint.toBuffer()],
    programId
  );
}
```

### 2. Updated `useBorrowing` Hook
**File:** `app/src/hooks/useBorrowing.ts`

- **Removed** `collateralPoolAddress` parameter from `borrow()`, `repay()`, and `loadBorrowerState()`
- These functions now **derive** the collateral pool PDA from the token mint instead

Before:
```typescript
borrow(collateralPoolAddress, lendingPoolAddress, amount, tokenMint)
```

After:
```typescript
borrow(lendingPoolAddress, amount, tokenMint)
// Internally derives: collateralPoolPDA = deriveCollateralPoolPDA(tokenMint)
```

### 3. Updated Page Component
**File:** `app/src/app/borrow/page.tsx`

Updated all calls to remove the borrowing program ID:

Before:
```typescript
borrowing.borrow(PROGRAM_IDS.borrowing, PROGRAM_IDS.lending, amount, TOKEN_MINTS.testUsdc)
borrowing.repay(PROGRAM_IDS.borrowing, PROGRAM_IDS.lending, amount)
borrowing.loadBorrowerState(PROGRAM_IDS.borrowing)
```

After:
```typescript
borrowing.borrow(PROGRAM_IDS.lending, amount, TOKEN_MINTS.testUsdc)
borrowing.repay(PROGRAM_IDS.lending, amount)
borrowing.loadBorrowerState(TOKEN_MINTS.testUsdc)
```

## Required: Initialize the Collateral Pool

Before users can borrow, the collateral pool must be initialized on-chain.

### Initialization Script

A new script has been created: `contracts/scripts/init-collateral-pool.ts`

### How to Run

1. **Set the Test USDC mint address:**
   ```bash
   cd contracts
   export TEST_USDC_MINT=<your-test-usdc-mint-address>
   ```

2. **Run the initialization script:**
   ```bash
   npx ts-node scripts/init-collateral-pool.ts
   ```

   Or use the shell script:
   ```bash
   ./scripts/init-collateral-pool.sh
   ```

### What the Script Does

1. Derives the collateral pool PDA from Test USDC mint
2. Creates the pool's associated token account (vault)
3. Initializes the collateral pool with:
   - Collateral Ratio: 150%
   - Liquidation Threshold: 120%
   - Borrow APY: 5%

## Expected Account Structure

When borrowing, these accounts are now passed:
1. `collateral_pool` - PDA owned by borrowing program (derived from mint)
2. `borrower_state` - PDA for user's borrowing state
3. `borrower` - Signer account
4. `system_program` - System program

## Testing

After initialization, try borrowing again. The transaction should now succeed because:
- The correct collateral pool PDA is being passed
- The PDA is owned by the borrowing program
- The account has the expected CollateralPool data structure
