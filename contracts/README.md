# Solana Smart Contracts for ZK Payroll Backed Loans

This directory contains three Solana programs (smart contracts) built using the Anchor framework for a decentralized lending platform with zero-knowledge proof verification.


## Programs

### 1. ZK Verifiable Credential Manager (`zk-verifiable-credential-manager`)

Manages zero-knowledge proofs and credentials for users.

**Functions:**
- `store_zk_tls_proof_and_public_output()` - Store ZK-TLS proof data and public outputs
- `get_zk_tls_proof_and_public_output()` - Retrieve stored proof data (view function)
- `verify_credential()` - Mark credential as verified (authority only)
- `revoke_credential()` - Revoke a credential

**Key Features:**
- Stores proof data up to 10KB
- Stores public output up to 2KB
- PDA-based credential storage
- Event emission for tracking
- Authority-based verification

### 2. Lending Program (`lending`)

Manages the lending pool where lenders can deposit funds and earn interest.

**Functions:**
- `initialize_lending_pool()` - Create a new lending pool
- `deposit_into_lending_pool()` - Deposit tokens to earn interest
- `withdraw_from_lending_pool()` - Withdraw deposited tokens
- `borrow_from_pool()` - Internal function for borrowing (CPI)
- `repay_to_pool()` - Internal function for repayment (CPI)

**Key Features:**
- Configurable interest rates
- Minimum deposit requirements
- Liquidity management
- PDA-based pool management
- Event emission for all operations

### 3. Borrowing Program (`borrowing`)

Manages collateralized borrowing against the lending pool.

**Functions:**
- `initialize_collateral_pool()` - Create a new collateral pool
- `deposit_into_collateral_pool()` - Deposit collateral
- `withdraw_from_collateral_pool()` - Withdraw collateral
- `borrow_from_lending_pool()` - Borrow against collateral
- `repay_to_lending_pool()` - Repay borrowed amount
- `liquidate()` - Liquidate undercollateralized positions

**Key Features:**
- Configurable collateral ratios (e.g., 150%)
- Liquidation threshold protection (e.g., 120%)
- Automatic collateralization checks
- Liquidation mechanism for bad debt
- PDA-based borrower state tracking


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



## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.17+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.29.0)
- [Node.js](https://nodejs.org/) (v16+)

## Installation

1. Install Anchor CLI:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

2. Install dependencies:
```bash
anchor build
```

## Building

Build all programs:
```bash
anchor build
```

Build individual programs:
```bash
cd programs/zk-verifiable-credential-manager && cargo build-bpf
cd programs/lending && cargo build-bpf
cd programs/borrowing && cargo build-bpf
```

## Testing

Run tests:
```bash
anchor test
```

Run tests with logs:
```bash
anchor test -- --nocapture
```

## Deployment

### Local Deployment (Localnet)

1. Start local validator:
```bash
solana-test-validator
```

2. Deploy programs:
```bash
anchor deploy
```

### Devnet Deployment

1. Configure for devnet:
```bash
solana config set --url devnet
```

2. Airdrop SOL for deployment:
```bash
solana airdrop 2
```

3. Deploy:
```bash
anchor deploy --provider.cluster devnet
```

## Program IDs

Update these in `Anchor.toml` after deployment:

- **ZK Verifiable Credential Manager**: `CrEd11111111111111111111111111111111111111`
- **Lending**: `Lend11111111111111111111111111111111111111`
- **Borrowing**: `Borr11111111111111111111111111111111111111`

## Usage Example

### Storing ZK Proof

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkVerifiableCredentialManager } from "../target/types/zk_verifiable_credential_manager";

const program = anchor.workspace.ZkVerifiableCredentialManager as Program<ZkVerifiableCredentialManager>;

const proofData = Buffer.from("..."); // Your ZK proof
const publicOutput = Buffer.from("..."); // Public outputs
const proofHash = new Uint8Array(32); // Hash of proof

await program.methods
  .storeZkTlsProofAndPublicOutput(proofData, publicOutput, proofHash)
  .accounts({
    credential: credentialPDA,
    owner: owner.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

### Depositing to Lending Pool

```typescript
import { Lending } from "../target/types/lending";

const lendingProgram = anchor.workspace.Lending as Program<Lending>;

await lendingProgram.methods
  .depositIntoLendingPool(new anchor.BN(1000000))
  .accounts({
    lendingPool: poolPDA,
    depositorAccount: depositorPDA,
    poolVault: vaultPDA,
    depositorTokenAccount: depositorTokenAccount,
    depositor: depositor.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Borrowing with Collateral

```typescript
import { Borrowing } from "../target/types/borrowing";

const borrowingProgram = anchor.workspace.Borrowing as Program<Borrowing>;

// 1. Deposit collateral
await borrowingProgram.methods
  .depositIntoCollateralPool(new anchor.BN(1500000))
  .accounts({
    collateralPool: collateralPoolPDA,
    borrowerState: borrowerStatePDA,
    poolVault: vaultPDA,
    borrowerCollateralAccount: borrowerCollateralAccount,
    borrower: borrower.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// 2. Borrow
await borrowingProgram.methods
  .borrowFromLendingPool(new anchor.BN(1000000))
  .accounts({
    collateralPool: collateralPoolPDA,
    borrowerState: borrowerStatePDA,
    borrower: borrower.publicKey,
  })
  .rpc();
```

## Architecture

```
┌─────────────────────────────────────┐
│  ZK Verifiable Credential Manager   │
│  - Store/Verify ZK Proofs           │
└─────────────────────────────────────┘
                 │
                 │ Credential Verification
                 ▼
┌─────────────────────────────────────┐
│         Lending Program             │
│  - Deposit/Withdraw Liquidity       │
│  - Earn Interest                    │
└─────────────────────────────────────┘
                 │
                 │ CPI Calls
                 ▼
┌─────────────────────────────────────┐
│        Borrowing Program            │
│  - Collateral Management            │
│  - Borrow/Repay Loans               │
│  - Liquidations                     │
└─────────────────────────────────────┘
```

## Security Considerations

1. **Collateral Ratios**: Ensure collateral ratios are set appropriately to protect against market volatility
2. **Liquidation Thresholds**: Set liquidation thresholds with sufficient buffer above 100%
3. **Authority Keys**: Secure the authority key used for credential verification
4. **Oracle Integration**: Consider integrating price oracles for accurate collateral valuation
5. **Testing**: Thoroughly test all edge cases, especially liquidation scenarios

## Future Enhancements

- [ ] Oracle integration for price feeds
- [ ] Interest accrual mechanism
- [ ] Flash loan protection
- [ ] Multi-collateral support
- [ ] Governance mechanism
- [ ] Emergency pause functionality

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
