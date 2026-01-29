# Contract Functions to UI Mapping

This document describes how the UI pages map to the Solana contract functions.

## Lending Page (`/app/src/app/lend/page.tsx`)

The Lending page provides UI for interacting with the **Lending Contract** (`contracts/programs/lending`).

### Contract Functions Exposed:

#### 1. **deposit_into_lending_pool**
- **UI Element**: "Supply" button in the Lending Pools table
- **Modal**: "Supply to Lending Pool" modal
- **Input**: Amount in USDC (or other supported tokens)
- **Description**: Deposits tokens into the lending pool to earn interest
- **Required Accounts**:
  - `lending_pool`: The lending pool PDA
  - `depositor_account`: The depositor account PDA (created or updated)
  - `depositor`: Signer (user's wallet)
  - `depositor_token_account`: User's token account
  - `pool_vault`: Pool's token vault
  - `token_program`: SPL Token program
  - `system_program`: System program

#### 2. **withdraw_from_lending_pool**
- **UI Element**: "Withdraw" button in the Lending Pools table
- **Modal**: "Withdraw from Lending Pool" modal
- **Input**: Amount to withdraw
- **Description**: Withdraws deposited tokens and earned interest from the lending pool
- **Required Accounts**:
  - `lending_pool`: The lending pool PDA
  - `depositor_account`: The depositor account PDA
  - `depositor`: Signer (user's wallet)
  - `depositor_token_account`: User's token account
  - `pool_vault`: Pool's token vault
  - `token_program`: SPL Token program

### User Status Display:
- **Your Total Supplied**: Shows total deposited amount across all pools
- **Earned Interest**: Shows accumulated interest
- **Average APY**: Shows average annual percentage yield
- **Your Lending Positions**: Table showing all active lending positions

---

## Borrowing Page (`/app/src/app/borrow/page.tsx`)

The Borrowing page provides UI for interacting with the **Borrowing Contract** (`contracts/programs/borrowing`).

### Contract Functions Exposed:

#### 1. **deposit_into_collateral_pool**
- **UI Element**: "Deposit Collateral" button
- **Modal**: "Deposit Collateral" modal
- **Input**: Amount in SOL (or other supported collateral)
- **Description**: Deposits collateral into the collateral pool to enable borrowing
- **Required Accounts**:
  - `collateral_pool`: The collateral pool PDA
  - `borrower_state`: The borrower state PDA (created or updated)
  - `borrower`: Signer (user's wallet)
  - `borrower_collateral_account`: User's collateral token account
  - `pool_vault`: Pool's collateral vault
  - `token_program`: SPL Token program
  - `system_program`: System program

#### 2. **borrow_from_lending_pool**
- **UI Element**: "Borrow" button
- **Modal**: "Borrow Assets" modal
- **Input**: Amount to borrow (must be within collateral ratio limits)
- **Description**: Borrows assets against deposited collateral
- **Required Accounts**:
  - `collateral_pool`: The collateral pool PDA
  - `borrower_state`: The borrower state PDA
  - `borrower`: Signer (user's wallet)
  - `borrower_token_account`: User's borrowed token account
  - `lending_pool`: The lending pool PDA (from lending program)
  - `lending_pool_vault`: Lending pool's vault
  - `lending_program`: The lending program ID
  - `token_program`: SPL Token program

#### 3. **repay_to_lending_pool**
- **UI Element**: "Repay" button
- **Modal**: "Repay Loan" modal
- **Input**: Amount to repay
- **Description**: Repays borrowed assets to reduce debt and improve health factor
- **Required Accounts**:
  - `borrower_state`: The borrower state PDA
  - `borrower`: Signer (user's wallet)
  - `borrower_token_account`: User's token account
  - `lending_pool_vault`: Lending pool's vault
  - `token_program`: SPL Token program

#### 4. **withdraw_from_collateral_pool**
- **UI Element**: "Withdraw Collateral" button
- **Modal**: "Withdraw Collateral" modal
- **Input**: Amount of collateral to withdraw
- **Description**: Withdraws collateral (only if health factor permits)
- **Required Accounts**:
  - `collateral_pool`: The collateral pool PDA
  - `borrower_state`: The borrower state PDA
  - `borrower`: Signer (user's wallet)
  - `borrower_collateral_account`: User's collateral token account
  - `pool_vault`: Pool's collateral vault
  - `token_program`: SPL Token program

### User Status Display:
- **Your Collateral**: Total collateral deposited
- **Total Borrowed**: Total amount borrowed
- **Available to Borrow**: Maximum additional borrowing capacity
- **Health Factor**: Collateral ratio health indicator
  - `> 1.5`: Safe (green)
  - `1.2 - 1.5`: Warning (yellow)
  - `< 1.2`: At risk of liquidation (red)
- **Your Borrowing Positions**: Table showing all active borrow positions

---

## Credential Page (`/app/src/app/credential/page.tsx`)

The Credential page provides UI for interacting with the **ZK Verifiable Credential Manager Contract** (`contracts/programs/zk-verifiable-credential-manager`).

### Contract Functions Exposed:

#### 1. **store_zk_tls_proof_and_public_output**
- **UI Element**: 
  - "Generate ZK-TLS Proof" button (ZkTlsButton component)
  - "Upload Existing Proof" button
- **Modal**: "Upload ZK Proof" modal
- **Inputs**: 
  - Proof Data (JSON)
  - Public Output (JSON)
- **Description**: Stores a zero-knowledge proof and its public outputs on-chain
- **Required Accounts**:
  - `credential`: The credential PDA (to be created)
  - `owner`: Signer (user's wallet)
  - `system_program`: System program
- **Parameters**:
  - `proof_data`: Vec<u8> (max 10KB)
  - `public_output`: Vec<u8> (max 2KB)
  - `proof_hash`: [u8; 32] (SHA-256 hash)

#### 2. **get_zk_tls_proof_and_public_output**
- **UI Element**: Credential details in the "Your Credentials" table
- **Description**: View function to retrieve stored credentials (read-only)
- **Implementation**: Fetches credential account data off-chain

#### 3. **verify_credential**
- **UI Element**: "Verify" button in the credentials table
- **Description**: Marks a credential as verified (authority only)
- **Required Accounts**:
  - `credential`: The credential PDA
  - `authority`: Authority signer (must be the program authority)
- **Note**: In production, this should only be callable by authorized verifiers

#### 4. **revoke_credential**
- **UI Element**: "Revoke" button in the credentials table
- **Description**: Revokes a credential (owner only)
- **Required Accounts**:
  - `credential`: The credential PDA
  - `owner`: Owner signer (user's wallet)

### User Status Display:
- **Total Credentials**: Count of all credentials owned by the user
- **Verified Credentials**: Count of verified credentials
- **Pending Verification**: Count of unverified credentials
- **Your Credentials Table**: Lists all credentials with:
  - Proof Hash
  - Type (e.g., "Payroll")
  - Created timestamp
  - Verification status
  - Action buttons

---

## Contract Program IDs

The following program IDs are used in the application:

- **Lending Program**: `G1sjiVDaPgDd5yfChYKguKVZs6tD1GE6zewBQwWmsMJi`
- **Borrowing Program**: `CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi`
- **ZK Credential Manager**: `5noDS5EGojcw8BuRA9vDAmSUBE8iCY2jnQBhzkyEiU1K`

---

## Implementation Status

Currently, all UI pages are implemented with:
- ✅ Complete UI components
- ✅ Form inputs and validation
- ✅ Modal dialogs for transactions
- ✅ Status displays
- ✅ Wallet connection using AppKit (Reown)
- ⏳ Contract integration (TODO - requires IDL generation and Anchor integration)

### Next Steps for Full Integration:

1. **Build and Deploy Contracts**:
   ```bash
   cd contracts
   anchor build
   anchor deploy
   ```

2. **Generate TypeScript IDLs**:
   ```bash
   cd contracts
   anchor build
   # IDL files will be in target/idl/
   ```

3. **Install Anchor Dependencies in App**:
   ```bash
   cd app
   npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
   ```

4. **Create Program Clients**:
   - Copy IDL files to `app/src/idl/`
   - Create program client instances
   - Implement PDA derivation functions

5. **Implement Transaction Functions**:
   - Replace TODO comments with actual contract calls
   - Add transaction signing and confirmation
   - Implement error handling and user feedback

---

## Wallet Connection

The app uses **Reown AppKit** (formerly WalletConnect) for wallet connections:
- Supports multiple Solana wallets (Phantom, Solflare, etc.)
- Configured in `app/src/context/index.tsx`
- Network: Solana Devnet (configurable in `app/src/config/index.ts`)

---

## Testing the UI

1. **Start the Development Server**:
   ```bash
   cd app
   npm run dev
   ```

2. **Connect Your Wallet**:
   - Click "Connect Wallet" button
   - Select your Solana wallet
   - Approve the connection

3. **Navigate Between Pages**:
   - **Lend**: `/lend` - Supply assets and earn interest
   - **Borrow**: `/borrow` - Deposit collateral and borrow
   - **Credentials**: `/credential` - Manage ZK credentials

4. **Test UI Flows** (Currently simulated):
   - All buttons and forms are functional
   - Modals open and close correctly
   - Input validation works
   - Status displays update (with mock data)

---

## Code Structure

```
app/src/
├── app/
│   ├── lend/page.tsx          # Lending UI
│   ├── borrow/page.tsx        # Borrowing UI
│   ├── credential/page.tsx    # Credentials UI
│   └── layout.tsx             # Main layout with navigation
├── components/
│   ├── ConnectButton.tsx      # Wallet connect button
│   ├── StatsCard.tsx          # Stats display component
│   ├── TransactionModal.tsx   # Modal for transactions
│   ├── ZkTlsButton.tsx        # ZK-TLS proof generation
│   └── Navigation.tsx         # Main navigation
├── context/
│   └── index.tsx              # AppKit wallet provider
└── config/
    └── index.ts               # Network configuration
```

---

## Key Features

### Lending Page
- View available lending pools
- Deposit assets to earn interest
- Withdraw assets with accumulated interest
- Monitor APY and utilization rates
- Track personal lending positions

### Borrowing Page
- Deposit collateral (SOL, etc.)
- Borrow against collateral
- Repay loans
- Withdraw collateral
- Monitor health factor
- Collateral ratio: 150%
- Liquidation threshold: 120%

### Credential Page
- Generate ZK-TLS proofs for payroll data
- Upload existing proofs
- Verify credentials
- Revoke credentials
- View credential history
- Privacy-preserving proof system

---

## Security Considerations

1. **Wallet Security**: Never share private keys
2. **Transaction Review**: Always review transaction details before signing
3. **Health Factor**: Keep health factor > 1.5 to avoid liquidation
4. **Proof Privacy**: ZK proofs reveal no sensitive data
5. **Authority**: Only authorized entities can verify credentials

---

## Support

For issues or questions:
- Check the main README.md
- Review contract documentation in `contracts/`
- Check integration guides in `app/docs/`
