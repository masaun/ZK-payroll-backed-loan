# Deployment Configuration

This directory contains migration and initialization scripts for deploying the ZK Payroll Backed Loan contracts.

## Scripts

### `migrate.sh`
Main migration script that:
1. Deploys all three programs
2. Displays deployed program IDs
3. Runs initialization script

Usage:
```bash
# Deploy to localnet
./migrate.sh localnet

# Deploy to devnet
./migrate.sh devnet

# Deploy to mainnet
./migrate.sh mainnet-beta
```

### `initialize.ts`
TypeScript initialization script that:
1. Creates token mints for USDC and collateral
2. Initializes lending pool with interest rates
3. Initializes collateral pool with collateralization parameters
4. Saves deployment configuration

## Deployment Configuration

After running initialization, a `deployment-config.json` file will be created in the contracts root directory containing:

- Cluster information
- Lending pool addresses and parameters
- Collateral pool addresses and parameters
- Token mint addresses
- Deployment timestamp

## Prerequisites

1. Ensure Anchor is installed and configured
2. Have sufficient SOL in your wallet
3. Build the programs first: `anchor build`

## Steps to Deploy

1. **Build programs:**
   ```bash
   anchor build
   ```

2. **Update program IDs in code:**
   - Copy the program IDs from `target/deploy/*-keypair.json`
   - Update the `declare_id!()` in each `lib.rs` file
   - Update `Anchor.toml` with the program IDs

3. **Rebuild with correct IDs:**
   ```bash
   anchor build
   ```

4. **Run migration:**
   ```bash
   ./migrate.sh devnet
   ```

5. **Verify deployment:**
   ```bash
   solana program show <PROGRAM_ID>
   ```

## Configuration Parameters

### Lending Pool
- **Interest Rate:** 500 basis points (5%)
- **Minimum Deposit:** 1 USDC (1,000,000 with 6 decimals)

### Collateral Pool
- **Collateral Ratio:** 15000 basis points (150%)
- **Liquidation Threshold:** 12000 basis points (120%)

These can be modified in `initialize.ts` before deployment.

## Post-Deployment

After successful deployment:

1. Save the `deployment-config.json` file
2. Share relevant addresses with frontend developers
3. Test the deployment using the example scripts
4. Set up monitoring and alerts

## Upgrading Contracts

Solana programs can be upgraded if the upgrade authority is set:

```bash
# Upgrade a program
solana program deploy target/deploy/lending.so --program-id <PROGRAM_ID>
```

Make sure to test upgrades on devnet before mainnet!
