# ZK Payroll-Backed Loan - Solana Smart Contracts

Solana programs (smart contracts) built with Anchor framework for a decentralized lending platform with zero-knowledge proof verification.

## Overview

This directory contains the on-chain smart contracts that power the ZK Payroll-Backed Loan platform. The system consists of four interconnected Anchor programs deployed on Solana Devnet:

1. **ZK Verifiable Credential Manager** - Stores and manages zero-knowledge proofs (zkTLS payroll proofs)
2. **Lending Pool** - Manages liquidity from lenders and facilitates borrowing
3. **Borrowing Pool** - Handles borrowing operations with collateral management
4. **Test USDC** - Mock USDC token for testing on Devnet

### Architecture Overview

The contracts work together to enable privacy-preserving, payroll-backed lending:

- **Borrowers** deposit collateral or prove payroll via ZK proofs to obtain loans
- **Lenders** deposit funds into lending pools to earn interest
- **ZK Proofs** are stored on-chain to verify eligibility without revealing sensitive data
- **Cross-Program Invocation (CPI)** enables seamless interaction between programs

## Deployed Contract Addresses (Solana Devnet)

### Program IDs

| Program | Program ID (Devnet) |
|---------|-------------------|
| **ZK Verifiable Credential Manager** | `5noDS5EGojcw8BuRA9vDAmSUBE8iCY2jnQBhzkyEiU1K` |
| **Lending Pool** | `G1sjiVDaPgDd5yfChYKguKVZs6tD1GE6zewBQwWmsMJi` |
| **Borrowing Pool** | `CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi` |
| **Test USDC** | `41NBEbnBWvQTLs6TRKCDWH88rJTpdFUvq5WA3zpQGYfY` |

### Verify Deployment

You can verify these programs are deployed on Solana Devnet:

```bash
# Check ZK Credential Manager
solana program show 5noDS5EGojcw8BuRA9vDAmSUBE8iCY2jnQBhzkyEiU1K --url devnet

# Check Lending Pool
solana program show G1sjiVDaPgDd5yfChYKguKVZs6tD1GE6zewBQwWmsMJi --url devnet

# Check Borrowing Pool
solana program show CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi --url devnet

# Check Test USDC
solana program show 41NBEbnBWvQTLs6TRKCDWH88rJTpdFUvq5WA3zpQGYfY --url devnet
```

### Explorer Links

- [ZK Credential Manager on Solana Explorer](https://explorer.solana.com/address/5noDS5EGojcw8BuRA9vDAmSUBE8iCY2jnQBhzkyEiU1K?cluster=devnet)
- [Lending Pool on Solana Explorer](https://explorer.solana.com/address/G1sjiVDaPgDd5yfChYKguKVZs6tD1GE6zewBQwWmsMJi?cluster=devnet)
- [Borrowing Pool on Solana Explorer](https://explorer.solana.com/address/CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi?cluster=devnet)
- [Test USDC on Solana Explorer](https://explorer.solana.com/address/41NBEbnBWvQTLs6TRKCDWH88rJTpdFUvq5WA3zpQGYfY?cluster=devnet)


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



## Installation

### Prerequisites

- **Rust** (latest stable) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Solana CLI** v1.17+ - [Install Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor CLI** v0.29.0 - [Install Anchor](https://www.anchor-lang.com/docs/installation)
- **Node.js** v16+ - [Install Node.js](https://nodejs.org/)
- **Yarn** or **npm** - Package manager

### Step 1: Install Anchor CLI

```bash
# Install Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install latest Anchor
avm install latest
avm use latest

# Verify installation
anchor --version
```

Expected output: `anchor-cli 0.29.0` or higher

### Step 2: Clone and Navigate

```bash
cd contracts
```

### Step 3: Install Dependencies

```bash
# Install Node.js dependencies for tests
yarn install
# or
npm install
```

### Step 4: Build Programs

Build all programs:

```bash
anchor build
```

Or build individually:

```bash
cd programs/zk-verifiable-credential-manager && cargo build-bpf
cd programs/lending && cargo build-bpf
cd programs/borrowing && cargo build-bpf
cd programs/test-usdc && cargo build-bpf
```

### Step 5: Generate TypeScript Types

```bash
anchor build
```

This generates TypeScript type definitions in `target/types/`

### Step 6: Configure Solana CLI

For Devnet deployment:

```bash
# Set cluster to devnet
solana config set --url devnet

# Create or set keypair
solana-keygen new --outfile deployer-keypair.json

# Airdrop SOL for deployment (2 SOL minimum)
solana airdrop 2 --keypair deployer-keypair.json
```

### Step 7: Run Tests (Optional)

```bash
# Run all tests
anchor test

# Run with logs
anchor test -- --nocapture

# Run specific test file
anchor test -- tests/lending.test.ts
```

### Step 8: Deploy to Devnet

```bash
# Deploy all programs
anchor deploy --provider.cluster devnet

# Or use the deployment script
./deploy.sh
```

After deployment, the program IDs will be displayed. Update `Anchor.toml` and `app/src/config/index.ts` with the new addresses if needed.

### Step 9: Initialize Programs

Initialize lending and collateral pools:

```bash
# Run initialization script
cd migrations
./migrate.sh

# Or manually
ts-node migrations/initialize.ts
```

### Step 10: Verify Deployment

Check deployment status:

```bash
./status.sh
```

Or manually:

```bash
# Check program deployment
solana program show <PROGRAM_ID> --url devnet

# Check account data
solana account <ACCOUNT_ADDRESS> --url devnet
```

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

## References

### Solana Development
- [Solana Documentation](https://docs.solana.com/) - Official Solana documentation
- [Solana Cookbook](https://solanacookbook.com/) - Developer recipes and examples
- [Solana Program Library (SPL)](https://spl.solana.com/) - Standard token programs
- [Solana Stack Exchange](https://solana.stackexchange.com/) - Community Q&A
- [Solana CLI Reference](https://docs.solana.com/cli) - Command-line tools

### Anchor Framework
- [Anchor Documentation](https://www.anchor-lang.com/) - Framework documentation
- [Anchor Book](https://book.anchor-lang.com/) - Comprehensive guide
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/examples) - Official examples
- [Anchor Discord](https://discord.gg/PDeRXyVURd) - Community support

### Smart Contract Patterns
- [Solana Program Architecture](https://docs.solana.com/developing/programming-model/overview) - Core concepts
- [PDA (Program Derived Addresses)](https://solanacookbook.com/core-concepts/pdas.html) - Account derivation
- [CPI (Cross-Program Invocation)](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocation) - Inter-program calls
- [Token Program Guide](https://spl.solana.com/token) - SPL Token operations

### Testing & Security
- [Anchor Testing Guide](https://book.anchor-lang.com/anchor_in_depth/testing.html) - Writing tests
- [Solana Security Best Practices](https://github.com/coral-xyz/sealevel-attacks) - Security patterns
- [Neodyme Security Guide](https://workshop.neodyme.io/) - Smart contract security

### Project Documentation
- [Main README](../README.md) - Project overview and architecture
- [Frontend README](../app/README.md) - Next.js application
- [Circuits README](../circuits/README.md) - Noir ZK circuits
- [API Documentation](./docs/README_INIT_POOL.md) - Pool initialization guide

### Tools & Explorers
- [Solana Explorer](https://explorer.solana.com/) - View transactions and accounts
- [Solana Beach](https://solanabeach.io/) - Alternative explorer
- [Anchor Playground](https://beta.solpg.io/) - Browser-based IDE

### Related Projects
- [Jet Protocol](https://github.com/jet-lab/jet-v2) - DeFi lending on Solana
- [Solend](https://github.com/solendprotocol/solana-program-library) - Algorithmic lending
- [Mango Markets](https://github.com/blockworks-foundation/mango-v3) - Margin trading

---

**Built for Solana Privacy Hackathon 🔐 (Jan 12 - Feb 1, 2026)**

**License:** MIT
