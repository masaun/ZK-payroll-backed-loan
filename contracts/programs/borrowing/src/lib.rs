use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CZAYDeyBbkC6DFiV8WRP9bdtdziixV8MP38sS9TARvPi");

#[program]
pub mod borrowing {
    use super::*;

    /// Initialize a collateral pool
    pub fn initialize_collateral_pool(
        ctx: Context<InitializeCollateralPool>,
        collateral_ratio: u64, // Basis points (e.g., 15000 = 150%)
        liquidation_threshold: u64, // Basis points (e.g., 12000 = 120%)
    ) -> Result<()> {
        let pool = &mut ctx.accounts.collateral_pool;
        
        pool.authority = ctx.accounts.authority.key();
        pool.collateral_mint = ctx.accounts.collateral_mint.key();
        pool.pool_vault = ctx.accounts.pool_vault.key();
        pool.total_collateral = 0;
        pool.collateral_ratio = collateral_ratio;
        pool.liquidation_threshold = liquidation_threshold;
        pool.bump = ctx.bumps.collateral_pool;

        emit!(CollateralPoolInitialized {
            pool: pool.key(),
            authority: pool.authority,
            collateral_ratio,
            liquidation_threshold,
        });

        Ok(())
    }

    /// Deposit collateral into the collateral pool
    pub fn deposit_into_collateral_pool(
        ctx: Context<DepositIntoCollateralPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.collateral_pool;
        let borrower_state = &mut ctx.accounts.borrower_state;

        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer collateral tokens from borrower to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_collateral_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update borrower state
        borrower_state.borrower = ctx.accounts.borrower.key();
        borrower_state.collateral_pool = pool.key();
        borrower_state.collateral_amount += amount;
        borrower_state.collateral_timestamp = Clock::get()?.unix_timestamp;

        // Update pool totals
        pool.total_collateral += amount;

        emit!(CollateralDeposited {
            pool: pool.key(),
            borrower: borrower_state.borrower,
            amount,
            total_collateral: borrower_state.collateral_amount,
        });

        Ok(())
    }

    /// Withdraw collateral from the collateral pool
    pub fn withdraw_from_collateral_pool(
        ctx: Context<WithdrawFromCollateralPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.collateral_pool;
        let borrower_state = &mut ctx.accounts.borrower_state;

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            borrower_state.collateral_amount >= amount,
            ErrorCode::InsufficientCollateral
        );

        // Check if borrower has outstanding loans
        if borrower_state.borrowed_amount > 0 {
            let remaining_collateral = borrower_state.collateral_amount - amount;
            let required_collateral = borrower_state.borrowed_amount
                .checked_mul(pool.collateral_ratio)
                .unwrap()
                .checked_div(10000)
                .unwrap();

            require!(
                remaining_collateral >= required_collateral,
                ErrorCode::InsufficientCollateralAfterWithdrawal
            );
        }

        // Transfer collateral tokens from pool vault to borrower
        let seeds = &[
            b"collateral_pool",
            pool.collateral_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.borrower_collateral_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update borrower state
        borrower_state.collateral_amount -= amount;

        // Update pool totals
        pool.total_collateral -= amount;

        emit!(CollateralWithdrawn {
            pool: pool.key(),
            borrower: borrower_state.borrower,
            amount,
            remaining_collateral: borrower_state.collateral_amount,
        });

        Ok(())
    }

    /// Borrow from lending pool using collateral
    pub fn borrow_from_lending_pool(
        ctx: Context<BorrowFromLendingPool>,
        amount: u64,
    ) -> Result<()> {
        let collateral_pool = &ctx.accounts.collateral_pool;
        let borrower_state = &mut ctx.accounts.borrower_state;

        require!(amount > 0, ErrorCode::InvalidAmount);

        // Calculate required collateral
        let required_collateral = amount
            .checked_mul(collateral_pool.collateral_ratio)
            .unwrap()
            .checked_div(10000)
            .unwrap();

        require!(
            borrower_state.collateral_amount >= required_collateral,
            ErrorCode::InsufficientCollateral
        );

        // Call lending program to borrow (CPI)
        // Note: This requires the lending program to be imported
        // For now, we'll track the borrow internally
        
        // Update borrower state
        borrower_state.borrowed_amount += amount;
        borrower_state.borrow_timestamp = Clock::get()?.unix_timestamp;

        emit!(LoanBorrowed {
            borrower: borrower_state.borrower,
            amount,
            collateral_amount: borrower_state.collateral_amount,
            total_borrowed: borrower_state.borrowed_amount,
        });

        Ok(())
    }

    /// Repay loan to lending pool
    pub fn repay_to_lending_pool(
        ctx: Context<RepayToLendingPool>,
        amount: u64,
    ) -> Result<()> {
        let borrower_state = &mut ctx.accounts.borrower_state;

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            borrower_state.borrowed_amount >= amount,
            ErrorCode::RepaymentExceedsDebt
        );

        // Transfer repayment tokens from borrower
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.lending_pool_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update borrower state
        borrower_state.borrowed_amount -= amount;

        emit!(LoanRepaid {
            borrower: borrower_state.borrower,
            amount,
            remaining_debt: borrower_state.borrowed_amount,
        });

        Ok(())
    }

    /// Liquidate undercollateralized position
    pub fn liquidate(
        ctx: Context<Liquidate>,
    ) -> Result<()> {
        let collateral_pool = &mut ctx.accounts.collateral_pool;
        let borrower_state = &mut ctx.accounts.borrower_state;

        // Check if position is undercollateralized
        let current_collateral_ratio = if borrower_state.borrowed_amount > 0 {
            borrower_state.collateral_amount
                .checked_mul(10000)
                .unwrap()
                .checked_div(borrower_state.borrowed_amount)
                .unwrap()
        } else {
            u64::MAX
        };

        require!(
            current_collateral_ratio < collateral_pool.liquidation_threshold,
            ErrorCode::PositionNotLiquidatable
        );

        let collateral_to_liquidate = borrower_state.collateral_amount;
        let debt_to_clear = borrower_state.borrowed_amount;

        // Transfer collateral to liquidator
        let seeds = &[
            b"collateral_pool",
            collateral_pool.collateral_mint.as_ref(),
            &[collateral_pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.liquidator_collateral_account.to_account_info(),
            authority: collateral_pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, collateral_to_liquidate)?;

        // Transfer repayment from liquidator to lending pool
        let repay_accounts = Transfer {
            from: ctx.accounts.liquidator_token_account.to_account_info(),
            to: ctx.accounts.lending_pool_vault.to_account_info(),
            authority: ctx.accounts.liquidator.to_account_info(),
        };
        let repay_program = ctx.accounts.token_program.to_account_info();
        let repay_ctx = CpiContext::new(repay_program, repay_accounts);
        token::transfer(repay_ctx, debt_to_clear)?;

        // Update state
        borrower_state.collateral_amount = 0;
        borrower_state.borrowed_amount = 0;
        collateral_pool.total_collateral -= collateral_to_liquidate;

        emit!(PositionLiquidated {
            borrower: borrower_state.borrower,
            liquidator: ctx.accounts.liquidator.key(),
            collateral_liquidated: collateral_to_liquidate,
            debt_cleared: debt_to_clear,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollateralPool<'info> {
    #[account(
        init,
        payer = authority,
        space = CollateralPool::LEN,
        seeds = [b"collateral_pool", collateral_mint.key().as_ref()],
        bump
    )]
    pub collateral_pool: Account<'info, CollateralPool>,
    
    /// CHECK: Collateral token mint
    pub collateral_mint: AccountInfo<'info>,
    
    #[account(
        constraint = pool_vault.mint == collateral_mint.key(),
        constraint = pool_vault.owner == collateral_pool.key()
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositIntoCollateralPool<'info> {
    #[account(mut)]
    pub collateral_pool: Account<'info, CollateralPool>,
    
    #[account(
        init_if_needed,
        payer = borrower,
        space = BorrowerState::LEN,
        seeds = [b"borrower", borrower.key().as_ref(), collateral_pool.key().as_ref()],
        bump
    )]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == collateral_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = borrower_collateral_account.owner == borrower.key(),
        constraint = borrower_collateral_account.mint == collateral_pool.collateral_mint
    )]
    pub borrower_collateral_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFromCollateralPool<'info> {
    #[account(mut)]
    pub collateral_pool: Account<'info, CollateralPool>,
    
    #[account(
        mut,
        seeds = [b"borrower", borrower.key().as_ref(), collateral_pool.key().as_ref()],
        bump,
        constraint = borrower_state.borrower == borrower.key()
    )]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == collateral_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = borrower_collateral_account.owner == borrower.key(),
        constraint = borrower_collateral_account.mint == collateral_pool.collateral_mint
    )]
    pub borrower_collateral_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BorrowFromLendingPool<'info> {
    #[account(mut)]
    pub collateral_pool: Account<'info, CollateralPool>,
    
    #[account(
        mut,
        seeds = [b"borrower", borrower.key().as_ref(), collateral_pool.key().as_ref()],
        bump,
        constraint = borrower_state.borrower == borrower.key()
    )]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
}

#[derive(Accounts)]
pub struct RepayToLendingPool<'info> {
    #[account(
        mut,
        seeds = [b"borrower", borrower.key().as_ref(), collateral_pool.key().as_ref()],
        bump,
        constraint = borrower_state.borrower == borrower.key()
    )]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lending_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    /// CHECK: Collateral pool for reference
    pub collateral_pool: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub collateral_pool: Account<'info, CollateralPool>,
    
    #[account(
        mut,
        seeds = [b"borrower", borrower_state.borrower.as_ref(), collateral_pool.key().as_ref()],
        bump
    )]
    pub borrower_state: Account<'info, BorrowerState>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == collateral_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub liquidator_collateral_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub liquidator_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lending_pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub liquidator: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct CollateralPool {
    pub authority: Pubkey,
    pub collateral_mint: Pubkey,
    pub pool_vault: Pubkey,
    pub total_collateral: u64,
    pub collateral_ratio: u64, // in basis points
    pub liquidation_threshold: u64, // in basis points
    pub bump: u8,
}

impl CollateralPool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct BorrowerState {
    pub borrower: Pubkey,
    pub collateral_pool: Pubkey,
    pub collateral_amount: u64,
    pub borrowed_amount: u64,
    pub collateral_timestamp: i64,
    pub borrow_timestamp: i64,
}

impl BorrowerState {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8;
}

#[event]
pub struct CollateralPoolInitialized {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub collateral_ratio: u64,
    pub liquidation_threshold: u64,
}

#[event]
pub struct CollateralDeposited {
    pub pool: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub total_collateral: u64,
}

#[event]
pub struct CollateralWithdrawn {
    pub pool: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub remaining_collateral: u64,
}

#[event]
pub struct LoanBorrowed {
    pub borrower: Pubkey,
    pub amount: u64,
    pub collateral_amount: u64,
    pub total_borrowed: u64,
}

#[event]
pub struct LoanRepaid {
    pub borrower: Pubkey,
    pub amount: u64,
    pub remaining_debt: u64,
}

#[event]
pub struct PositionLiquidated {
    pub borrower: Pubkey,
    pub liquidator: Pubkey,
    pub collateral_liquidated: u64,
    pub debt_cleared: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount specified")]
    InvalidAmount,
    
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    
    #[msg("Insufficient collateral after withdrawal")]
    InsufficientCollateralAfterWithdrawal,
    
    #[msg("Repayment amount exceeds debt")]
    RepaymentExceedsDebt,
    
    #[msg("Position is not liquidatable")]
    PositionNotLiquidatable,
}
