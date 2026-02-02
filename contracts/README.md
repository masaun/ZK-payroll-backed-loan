# ZK Payroll-Backed Loan - Solana Smart Contracts

## System Architecture (Simple Contract Interaction Flow)

### Lending Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         LENDER                               │
│                  (Connected via Wallet)                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Click "Deposit" with Amount
                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Lending Pool Contract                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Function:                                          │     │
│  │ • deposit_into_lending_pool(amount)                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Action:                                                      │
│  └─ Transfer Test USDC from Lender → Lending Pool Vault      │
│                                                               │
│  Storage Update:                                              │
│  ├─ LendingPool PDA                                           │
│  │  ├─ total_deposits += amount                              │
│  │  └─ pool_vault (holds Test USDC)                          │
│  └─ DepositorAccount PDA                                      │
│     ├─ deposited_amount += amount                             │
│     └─ deposit_timestamp = now()                              │
└─────────────────────────────────────────────────────────────┘
```

### Borrowing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        BORROWER                              │
│                 (Connected via Wallet)                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Click "Request a Loan" with Amount
                ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: Generate ZK Payroll Proof              │
│                   (Reclaim zkTLS Protocol)                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • Borrower authenticates with Payroll Provider     │     │
│  │   (ADP, Gusto, Workday, etc.)                      │     │
│  │ • zkTLS generates proof of payroll data            │     │
│  │ • Proof contains: salary, employment status, etc.  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Output: ZK Payroll Proof (zkTLS)                            │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│        STEP 2: Generate ZK Payroll-backed Loan Proof        │
│                    (Noir ZK Circuit)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • Takes ZK Payroll Proof as input                  │     │
│  │ • Verifies loan eligibility:                       │     │
│  │   - Employment status = active                     │     │
│  │   - Salary >= minimum threshold                    │     │
│  │   - Loan amount <= (salary × ratio)                │     │
│  │   - Tenure >= 12 months                            │     │
│  │ • Generates ZK Proof of eligibility                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Output: ZK Loan Eligibility Proof (Noir)                    │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│       STEP 3: Transfer Loan from Lending Pool               │
│                 (Solana Smart Contract)                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Function:                                          │     │
│  │ • borrow_from_lending_pool(amount)                 │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Validation:                                                  │
│  ├─ Verify ZK Proofs (off-chain verification)                │
│  ├─ Check lending pool has sufficient liquidity              │
│  └─ Validate borrower eligibility                            │
│                                                               │
│  Action:                                                      │
│  └─ Transfer Test USDC from Lending Pool → Borrower          │
│                                                               │
│  Storage Update:                                              │
│  ├─ LendingPool PDA                                           │
│  │  └─ total_borrowed += amount                              │
│  └─ BorrowerState PDA                                         │
│     ├─ borrowed_amount = amount                               │
│     └─ borrow_timestamp = now()                               │
└─────────────────────────────────────────────────────────────┘
```


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

Manages borrowing against the lending pool.

**Functions:**
- `borrow_from_lending_pool()` - Borrow against a `ZK Payroll-Backed Loan Proof`, which check the borrower's loan eligibility.
- `repay_to_lending_pool()` - Repay borrowed amount

**Key Features:**
- Liquidation mechanism for bad debt (TBD)
- PDA-based borrower state tracking




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


### Tools & Explorers
- [Solana Explorer](https://explorer.solana.com/) - View transactions and accounts
- [Solana Beach](https://solanabeach.io/) - Alternative explorer
- [Anchor Playground](https://beta.solpg.io/) - Browser-based IDE

