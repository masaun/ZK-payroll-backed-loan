# Quick Reference: UI to Contract Functions

## 📊 Lending Page (`/lend`)

| UI Element | Contract Function | Contract Program | Description |
|------------|------------------|------------------|-------------|
| **"Supply" Button** | `deposit_into_lending_pool` | `lending` | Deposit tokens to earn interest |
| **"Withdraw" Button** | `withdraw_from_lending_pool` | `lending` | Withdraw deposited tokens |
| **Your Total Supplied** | Read `depositor_account` | `lending` | Display user's total deposits |
| **Earned Interest** | Calculate from timestamps | `lending` | Calculate earned interest |
| **Pool Stats** | Read `lending_pool` | `lending` | Display pool information |

### Program ID
```
G1sjiVDaPgDd5yfChYKguKVZs6tD1GE6zewBQwWmsMJi
```

---

## 💰 Borrowing Page (`/borrow`)

| UI Element | Contract Function | Contract Program | Description |
|------------|------------------|------------------|-------------|
| **"Deposit Collateral" Button** | `deposit_into_collateral_pool` | `borrowing` | Add collateral to enable borrowing |
| **"Borrow" Button** | `borrow_from_lending_pool` | `borrowing` | Borrow against collateral |
| **"Repay" Button** | `repay_to_lending_pool` | `borrowing` | Repay borrowed amount |
| **"Withdraw Collateral" Button** | `withdraw_from_collateral_pool` | `borrowing` | Withdraw unused collateral |
| **Your Collateral** | Read `borrower_state.collateral_amount` | `borrowing` | Display collateral balance |
| **Total Borrowed** | Read `borrower_state.borrowed_amount` | `borrowing` | Display debt amount |
| **Health Factor** | Calculate from collateral/borrowed ratio | `borrowing` | Risk indicator |
| **Available to Borrow** | Calculate max borrow based on collateral | `borrowing` | Borrowing capacity |

### Program ID
```
CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi
```

---

## 🔐 Credential Page (`/credential`)

| UI Element | Contract Function | Contract Program | Description |
|------------|------------------|------------------|-------------|
| **"Generate ZK-TLS Proof" Button** | `store_zk_tls_proof_and_public_output` | `zk-credential-manager` | Generate and store new proof |
| **"Upload Existing Proof" Button** | `store_zk_tls_proof_and_public_output` | `zk-credential-manager` | Upload pre-generated proof |
| **"Verify" Button** | `verify_credential` | `zk-credential-manager` | Mark credential as verified (authority only) |
| **"Revoke" Button** | `revoke_credential` | `zk-credential-manager` | Revoke credential (owner only) |
| **Credentials Table** | Read all `zk_credential` accounts | `zk-credential-manager` | Display user's credentials |
| **Total Credentials** | Count credentials | `zk-credential-manager` | Credential count |
| **Verified Credentials** | Count verified credentials | `zk-credential-manager` | Verified count |

### Program ID
```
5noDS5EGojcw8BuRA9vDAmSUBE8iCY2jnQBhzkyEiU1K
```

---

## 🔗 Contract Function Details

### Lending Contract Functions

#### `deposit_into_lending_pool(amount: u64)`
- **Page**: Lending (`/lend`)
- **UI**: "Supply to Lending Pool" modal
- **Inputs**: Amount (USDC or other token)
- **Effect**: Increases user's deposit, pool's total deposits

#### `withdraw_from_lending_pool(amount: u64)`
- **Page**: Lending (`/lend`)
- **UI**: "Withdraw from Lending Pool" modal
- **Inputs**: Amount to withdraw
- **Effect**: Decreases user's deposit, pool's total deposits

---

### Borrowing Contract Functions

#### `deposit_into_collateral_pool(amount: u64)`
- **Page**: Borrowing (`/borrow`)
- **UI**: "Deposit Collateral" modal
- **Inputs**: Collateral amount (SOL, etc.)
- **Effect**: Increases user's collateral, enables borrowing

#### `borrow_from_lending_pool(amount: u64)`
- **Page**: Borrowing (`/borrow`)
- **UI**: "Borrow Assets" modal
- **Inputs**: Borrow amount (USDC, etc.)
- **Effect**: Increases user's debt, decreases health factor
- **Constraints**: Must maintain collateral ratio (150%)

#### `repay_to_lending_pool(amount: u64)`
- **Page**: Borrowing (`/borrow`)
- **UI**: "Repay Loan" modal
- **Inputs**: Repayment amount
- **Effect**: Decreases user's debt, improves health factor

#### `withdraw_from_collateral_pool(amount: u64)`
- **Page**: Borrowing (`/borrow`)
- **UI**: "Withdraw Collateral" modal
- **Inputs**: Withdrawal amount
- **Effect**: Decreases user's collateral
- **Constraints**: Must maintain minimum collateral for existing loans

---

### ZK Credential Manager Functions

#### `store_zk_tls_proof_and_public_output(proof_data: Vec<u8>, public_output: Vec<u8>, proof_hash: [u8; 32])`
- **Page**: Credential (`/credential`)
- **UI**: "Upload ZK Proof" modal or ZkTlsButton
- **Inputs**: 
  - Proof data (JSON, max 10KB)
  - Public output (JSON, max 2KB)
  - Auto-generated proof hash
- **Effect**: Stores credential on-chain

#### `verify_credential()`
- **Page**: Credential (`/credential`)
- **UI**: "Verify" button in credentials table
- **Inputs**: None (credential identified by PDA)
- **Effect**: Marks credential as verified
- **Authority**: Only program authority can call

#### `revoke_credential()`
- **Page**: Credential (`/credential`)
- **UI**: "Revoke" button in credentials table
- **Inputs**: None (credential identified by PDA)
- **Effect**: Marks credential as not verified
- **Authority**: Only credential owner can call

---

## 📱 Navigation Flow

```
Dashboard (/)
├── Lend (/lend)
│   ├── Supply Assets → deposit_into_lending_pool
│   └── Withdraw Assets → withdraw_from_lending_pool
│
├── Borrow (/borrow)
│   ├── Deposit Collateral → deposit_into_collateral_pool
│   ├── Borrow → borrow_from_lending_pool
│   ├── Repay → repay_to_lending_pool
│   └── Withdraw Collateral → withdraw_from_collateral_pool
│
└── Credentials (/credential)
    ├── Generate Proof → store_zk_tls_proof_and_public_output
    ├── Upload Proof → store_zk_tls_proof_and_public_output
    ├── Verify → verify_credential
    └── Revoke → revoke_credential
```

---

## 🎨 UI Component Structure

### Lending Page
```
lend/page.tsx
├── StatsCard (Your Total Supplied)
├── StatsCard (Earned Interest)
├── StatsCard (Average APY)
├── Lending Positions Table
├── Available Pools Table
│   ├── Supply Button → TransactionModal
│   └── Withdraw Button → TransactionModal
└── TransactionModal (Deposit/Withdraw)
```

### Borrowing Page
```
borrow/page.tsx
├── StatsCard (Your Collateral)
├── StatsCard (Total Borrowed)
├── StatsCard (Available to Borrow)
├── StatsCard (Health Factor)
├── Quick Actions Card
│   ├── Deposit Collateral Button → TransactionModal
│   ├── Borrow Button → TransactionModal
│   ├── Repay Button → TransactionModal
│   └── Withdraw Collateral Button → TransactionModal
├── Borrowing Positions Table
├── Available Collateral Pools Table
└── TransactionModals (4 types)
```

### Credential Page
```
credential/page.tsx
├── StatsCard (Total Credentials)
├── StatsCard (Verified Credentials)
├── StatsCard (Pending Verification)
├── ZK-TLS Proof Generation Card
│   ├── ZkTlsButton
│   └── Upload Button → TransactionModal
├── Your Credentials Table
│   ├── Verify Button (per credential)
│   └── Revoke Button (per credential)
├── How It Works Card
└── TransactionModal (Upload Proof)
```

---

## 💡 Implementation Notes

### Current Status
- ✅ All UI components implemented
- ✅ All forms and inputs functional
- ✅ Wallet connection integrated
- ✅ Form validation working
- ⏳ Contract calls (TODO - see code comments)

### To Complete Integration
1. Uncomment TODO sections in handler functions
2. Add PDA derivation logic
3. Import Anchor and create program instances
4. Add transaction confirmation UI
5. Replace `alert()` with proper toast notifications

### File Locations
- **Lending**: `app/src/app/lend/page.tsx`
- **Borrowing**: `app/src/app/borrow/page.tsx`
- **Credentials**: `app/src/app/credential/page.tsx`

---

## 📚 Additional Resources

- [Full UI Implementation Summary](UI_IMPLEMENTATION_SUMMARY.md)
- [Contract Functions to UI Mapping](CONTRACT_FUNCTIONS_UI_MAPPING.md)
- Lending Contract: `contracts/programs/lending/src/lib.rs`
- Borrowing Contract: `contracts/programs/borrowing/src/lib.rs`
- ZK Credential Manager: `contracts/programs/zk-verifiable-credential-manager/src/lib.rs`
