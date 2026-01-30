# System Architecture

## Contract Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         USER/CLIENT                          │
│                    (TypeScript/Web3.js)                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ 1. Store ZK Proof
                ▼
┌─────────────────────────────────────────────────────────────┐
│        ZK Verifiable Credential Manager Contract            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • storeZkTlsProofAndPublicOutput()                 │     │
│  │ • getZkTlsProofAndPublicOutput()                   │     │
│  │ • verifyCredential()                                │     │
│  │ • revokeCredential()                                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Storage:                                                     │
│  ├─ ZkCredential PDA                                          │
│  │  ├─ proof_data (Vec<u8>)                                  │
│  │  ├─ public_output (Vec<u8>)                               │
│  │  ├─ proof_hash ([u8; 32])                                 │
│  │  ├─ is_verified (bool)                                    │
│  │  └─ timestamp (i64)                                       │
└─────────────────────────────────────────────────────────────┘
                │
                │ 2. Verification Complete
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lending Contract                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Lender Functions:                                  │     │
│  │ • initializeLendingPool()                          │     │
│  │ • depositIntoLendingPool()  ─────────┐            │     │
│  │ • withdrawFromLendingPool() ─────────┤            │     │
│  │                                       │            │     │
│  │ Internal Functions (CPI):             │            │     │
│  │ • borrowFromPool()                    │            │     │
│  │ • repayToPool()                       │            │     │
│  └───────────────────────────────────────┼────────────┘     │
│                                           │                   │
│  Storage:                                 │                   │
│  ├─ LendingPool PDA                       │                   │
│  │  ├─ total_deposits (u64) ─────────────┘                   │
│  │  ├─ total_borrowed (u64)                                  │
│  │  ├─ interest_rate (u64)                                   │
│  │  └─ pool_vault (Pubkey)                                   │
│  └─ DepositorAccount PDA                                      │
│     ├─ deposited_amount (u64)                                 │
│     └─ deposit_timestamp (i64)                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ CPI Calls
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Borrowing Contract                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Borrower Functions:                                │     │
│  │ • initializeCollateralPool()                       │     │
│  │ • depositIntoCollateralPool()                      │     │
│  │ • withdrawFromCollateralPool()                     │     │
│  │ • borrowFromLendingPool() ────────────┐           │     │
│  │ • repayToLendingPool() ───────────────┤           │     │
│  │                                        │           │     │
│  │ Liquidation:                           │           │     │
│  │ • liquidate()                          │           │     │
│  └────────────────────────────────────────┼───────────┘     │
│                                            │                  │
│  Storage:                                  │                  │
│  ├─ CollateralPool PDA                     │                  │
│  │  ├─ total_collateral (u64)             │                  │
│  │  ├─ collateral_ratio (u64) ────────────┤ 150%             │
│  │  ├─ liquidation_threshold (u64) ───────┘ 120%             │
│  │  └─ pool_vault (Pubkey)                                   │
│  └─ BorrowerState PDA                                         │
│     ├─ collateral_amount (u64)                                │
│     ├─ borrowed_amount (u64)                                  │
│     ├─ collateral_timestamp (i64)                             │
│     └─ borrow_timestamp (i64)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Complete User Journey

```
1. Prove Payroll Income (ZK Credential Manager)
   ↓
   User submits ZK-TLS proof of payroll
   ├─ Proof Data: Employment verification
   ├─ Public Output: Salary range confirmed
   └─ Stored in PDA with timestamp

2. Provide Liquidity (Lending Contract)
   ↓
   Lender deposits USDC into lending pool
   ├─ Tokens transferred to pool vault
   ├─ Depositor account created/updated
   └─ Pool tracks total deposits

3. Deposit Collateral (Borrowing Contract)
   ↓
   Borrower deposits SOL as collateral
   ├─ Collateral transferred to vault
   ├─ Borrower state created/updated
   └─ Pool tracks total collateral

4. Borrow Funds (Borrowing → Lending CPI)
   ↓
   Borrower requests loan against collateral
   ├─ Check: Collateral >= Required (150%)
   ├─ Borrowing contract calls Lending
   ├─ Funds transferred to borrower
   └─ Both states updated

5. Repay Loan (Borrowing → Lending CPI)
   ↓
   Borrower repays loan + interest
   ├─ Tokens transferred to lending vault
   ├─ Borrowing contract calls Lending
   ├─ Borrowed amount decreases
   └─ Collateral becomes available

6. Withdraw Collateral (Borrowing Contract)
   ↓
   Borrower withdraws freed collateral
   ├─ Check: Remaining collateral sufficient
   ├─ Or: All debt repaid
   └─ Collateral returned to borrower
```

## Account Relationships

```
ZK Credential PDA
═══════════════════════════════════════
Seeds: ["credential", owner, proof_hash]
Owner: ZkCredentialManager Program
Data: Proof + Public Output + Metadata


Lending Pool PDA
═══════════════════════════════════════
Seeds: ["lending_pool", token_mint]
Owner: Lending Program
Associated: Pool Vault (SPL Token Account)


Depositor Account PDA
═══════════════════════════════════════
Seeds: ["depositor", depositor, pool]
Owner: Lending Program
Links to: Lending Pool PDA


Collateral Pool PDA
═══════════════════════════════════════
Seeds: ["collateral_pool", collateral_mint]
Owner: Borrowing Program
Associated: Pool Vault (SPL Token Account)


Borrower State PDA
═══════════════════════════════════════
Seeds: ["borrower", borrower, pool]
Owner: Borrowing Program
Links to: Collateral Pool PDA
```

## Security Model

```
┌─────────────────────────────────────────┐
│         Access Control Layer            │
├─────────────────────────────────────────┤
│ • PDA Ownership Verification            │
│ • Signer Checks                          │
│ • Authority Validation                   │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Collateralization Checks            │
├─────────────────────────────────────────┤
│ • Borrow: Collateral >= 150% of loan    │
│ • Withdraw: Remaining collateral OK      │
│ • Liquidate: Ratio < 120%                │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       Liquidity Management               │
├─────────────────────────────────────────┤
│ • Available = Deposits - Borrowed        │
│ • Withdraw: Check available liquidity    │
│ • Borrow: Check pool has funds           │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Event Emission                   │
├─────────────────────────────────────────┤
│ • All state changes logged               │
│ • Enables off-chain monitoring           │
│ • Audit trail for compliance             │
└─────────────────────────────────────────┘
```

## Token Flow Diagram

```
Lender Wallet                 Lending Pool Vault
     │                              │
     │  depositIntoLendingPool      │
     │─────────────────────────────>│
     │      (USDC transfer)          │
     │                              │
     │                              │
     │                         ┌────┴────┐
     │                         │ Tracks: │
     │                         │ - Total │
     │                         │ - Avail │
     │                         └────┬────┘
     │                              │
     │                              │ borrowFromPool (CPI)
     │                              │
     │                              v
     │                       Borrower Wallet
     │                              │
     │                              │ repayToLendingPool
     │                              │
     │                              v
     │                       Lending Pool Vault
     │  withdrawFromLendingPool     │
     │<─────────────────────────────│
     │      (USDC return)            │


Borrower Wallet            Collateral Pool Vault
     │                              │
     │  depositIntoCollateralPool   │
     │─────────────────────────────>│
     │    (SOL/collateral)          │
     │                              │
     │                         ┌────┴────┐
     │                         │ Tracks: │
     │                         │ - Coll  │
     │                         │ - Debt  │
     │                         └────┬────┘
     │                              │
     │  withdrawFromCollateralPool  │
     │<─────────────────────────────│
     │   (After repayment)          │
```
