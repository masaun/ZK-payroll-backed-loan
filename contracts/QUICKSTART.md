# ZK Payroll Backed Loan - Quick Start Guide

This guide will help you build, test, and deploy the ZK Payroll Backed Loan contracts.

## 🚀 Quick Start

### 1. Prerequisites

Install the required tools:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI (v1.17+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor (v0.29.0)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node.js dependencies
npm install
```

### 2. Build Contracts

```bash
# Build all programs
anchor build

# Or use the build script
./build.sh
```

### 3. Run Tests

```bash
# Run all tests
anchor test

# Or run with detailed output
anchor test -- --nocapture

# Run specific test file
anchor test tests/lending.test.ts
```

### 4. Deploy

#### Local Deployment

```bash
# Start local validator
solana-test-validator

# In another terminal, deploy
anchor deploy

# Or use the deploy script
./deploy.sh localnet
```

#### Devnet Deployment

```bash
# Configure for devnet
solana config set --url devnet

# Deploy
./deploy.sh devnet

# Run initialization
cd migrations
./migrate.sh devnet
```

### 5. Try Examples

```bash
# Complete flow demonstration
ts-node examples/complete-flow.ts

# ZK proof storage example
ts-node examples/zk-proof-storage.ts

# Lending pool example
ts-node examples/lending-pool.ts
```

## 📋 Contract Overview

### 1. ZkVerifiableCredentialManager
**Location:** `programs/zk-verifiable-credential-manager/`

Stores and manages ZK-TLS proofs for payroll verification.

**Key Functions:**
- `store_zk_tls_proof_and_public_output()` - Store proof data
- `get_zk_tls_proof_and_public_output()` - Retrieve proof
- `verify_credential()` - Mark as verified (authority only)
- `revoke_credential()` - Revoke credential

### 2. Lending Program
**Location:** `programs/lending/`

Manages liquidity pools for lending.

**Key Functions:**
- `initialize_lending_pool()` - Create new pool
- `deposit_into_lending_pool()` - Deposit funds
- `withdraw_from_lending_pool()` - Withdraw funds

**Parameters:**
- Interest Rate: 5% (500 basis points)
- Minimum Deposit: 1 USDC

### 3. Borrowing Program
**Location:** `programs/borrowing/`

Handles collateralized borrowing.

**Key Functions:**
- `initialize_collateral_pool()` - Create collateral pool
- `deposit_into_collateral_pool()` - Deposit collateral
- `withdraw_from_collateral_pool()` - Withdraw collateral
- `borrow_from_lending_pool()` - Borrow funds
- `repay_to_lending_pool()` - Repay loan
- `liquidate()` - Liquidate undercollateralized positions

**Parameters:**
- Collateral Ratio: 150% (15000 basis points)
- Liquidation Threshold: 120% (12000 basis points)

## 🧪 Testing Strategy

The test suite covers:

1. **ZK Credential Manager Tests** (`tests/zk-credential-manager.test.ts`)
   - Storing proofs
   - Retrieving proofs
   - Size validation
   - Event emission

2. **Lending Pool Tests** (`tests/lending.test.ts`)
   - Pool initialization
   - Deposits and withdrawals
   - Minimum deposit validation
   - Liquidity checks

3. **Borrowing Tests** (`tests/borrowing.test.ts`)
   - Collateral management
   - Borrowing with collateral checks
   - Repayment
   - Withdrawal constraints
   - Event tracking

## 📁 Project Structure

```
contracts/
├── Anchor.toml                 # Anchor configuration
├── Cargo.toml                  # Rust workspace
├── package.json                # Node.js dependencies
├── build.sh                    # Build script
├── deploy.sh                   # Deployment script
├── programs/                   # Smart contracts
│   ├── zk-verifiable-credential-manager/
│   ├── lending/
│   └── borrowing/
├── tests/                      # Test files
│   ├── zk-credential-manager.test.ts
│   ├── lending.test.ts
│   └── borrowing.test.ts
├── examples/                   # Usage examples
│   ├── complete-flow.ts
│   ├── zk-proof-storage.ts
│   └── lending-pool.ts
└── migrations/                 # Deployment scripts
    ├── migrate.sh
    ├── initialize.ts
    └── README.md
```

## 🔧 Configuration

### Update Program IDs

After building, update the program IDs in:

1. **Anchor.toml**
```toml
[programs.localnet]
zk_verifiable_credential_manager = "YOUR_PROGRAM_ID"
lending = "YOUR_PROGRAM_ID"
borrowing = "YOUR_PROGRAM_ID"
```

2. **Each lib.rs file**
```rust
declare_id!("YOUR_PROGRAM_ID");
```

Get program IDs:
```bash
solana address -k target/deploy/zk_verifiable_credential_manager-keypair.json
solana address -k target/deploy/lending-keypair.json
solana address -k target/deploy/borrowing-keypair.json
```

## 💡 Usage Examples

### Storing a ZK Proof

```typescript
const tx = await credentialProgram.methods
  .storeZkTlsProofAndPublicOutput(
    proofData,      // Your ZK proof bytes
    publicOutput,   // Public outputs
    proofHash       // 32-byte hash
  )
  .accounts({
    credential: credentialPDA,
    owner: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Depositing to Lending Pool

```typescript
const tx = await lendingProgram.methods
  .depositIntoLendingPool(new anchor.BN(amount))
  .accounts({
    lendingPool: poolPDA,
    depositorAccount: depositorPDA,
    poolVault: vaultPDA,
    depositorTokenAccount: tokenAccount,
    depositor: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Borrowing with Collateral

```typescript
// 1. Deposit collateral first
await borrowingProgram.methods
  .depositIntoCollateralPool(new anchor.BN(collateralAmount))
  .accounts({ /* ... */ })
  .rpc();

// 2. Borrow
await borrowingProgram.methods
  .borrowFromLendingPool(new anchor.BN(borrowAmount))
  .accounts({ /* ... */ })
  .rpc();
```

## 🐛 Troubleshooting

### Build Issues

```bash
# Clean and rebuild
anchor clean
anchor build
```

### Test Failures

```bash
# Ensure local validator is running
solana-test-validator --reset

# Run tests with logs
anchor test -- --nocapture
```

### Deployment Issues

```bash
# Check balance
solana balance

# Request airdrop (devnet)
solana airdrop 2

# Check program status
solana program show <PROGRAM_ID>
```

## 📚 Additional Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Documentation](https://spl.solana.com/token)

## 🔒 Security Considerations

1. **Test thoroughly** on devnet before mainnet
2. **Audit** all contracts before production use
3. **Monitor** liquidation thresholds closely
4. **Use** hardware wallets for authority keys
5. **Implement** emergency pause mechanisms for production

## 📝 License

MIT
