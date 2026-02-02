use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF");

#[program]
pub mod lending {
    use super::*;

    /// Initialize a lending pool
    pub fn initialize_lending_pool(
        ctx: Context<InitializeLendingPool>,
        interest_rate: u64, // Basis points (e.g., 500 = 5%)
        min_deposit: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.lending_pool;
        
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.pool_vault = ctx.accounts.pool_vault.key();
        pool.total_deposits = 0;
        pool.total_borrowed = 0;
        pool.interest_rate = interest_rate;
        pool.min_deposit = min_deposit;
        pool.bump = ctx.bumps.lending_pool;

        emit!(LendingPoolInitialized {
            pool: pool.key(),
            authority: pool.authority,
            interest_rate,
        });

        Ok(())
    }

    /// Deposit tokens into the lending pool
    pub fn deposit_into_lending_pool(
        ctx: Context<DepositIntoLendingPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.lending_pool;
        let depositor_account = &mut ctx.accounts.depositor_account;

        require!(amount >= pool.min_deposit, ErrorCode::DepositTooSmall);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer tokens from depositor to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update depositor account
        depositor_account.depositor = ctx.accounts.depositor.key();
        depositor_account.lending_pool = pool.key();
        depositor_account.deposited_amount += amount;
        depositor_account.deposit_timestamp = Clock::get()?.unix_timestamp;

        // Update pool totals
        pool.total_deposits += amount;

        emit!(DepositMade {
            pool: pool.key(),
            depositor: depositor_account.depositor,
            amount,
            total_deposits: pool.total_deposits,
        });

        Ok(())
    }

    /// Withdraw tokens from the lending pool
    pub fn withdraw_from_lending_pool(
        ctx: Context<WithdrawFromLendingPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.lending_pool;
        let depositor_account = &mut ctx.accounts.depositor_account;

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            depositor_account.deposited_amount >= amount,
            ErrorCode::InsufficientDeposit
        );

        let available_liquidity = pool.total_deposits - pool.total_borrowed;
        require!(
            available_liquidity >= amount,
            ErrorCode::InsufficientLiquidity
        );

        // Transfer tokens from pool vault to depositor
        let seeds = &[
            b"lending_pool",
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.depositor_token_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update depositor account
        depositor_account.deposited_amount -= amount;

        // Update pool totals
        pool.total_deposits -= amount;

        emit!(WithdrawalMade {
            pool: pool.key(),
            depositor: depositor_account.depositor,
            amount,
            total_deposits: pool.total_deposits,
        });

        Ok(())
    }

    /// Borrow from lending pool (called by borrowing contract via CPI)
    pub fn borrow_from_pool(
        ctx: Context<BorrowFromPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.lending_pool;

        let available_liquidity = pool.total_deposits - pool.total_borrowed;
        require!(
            available_liquidity >= amount,
            ErrorCode::InsufficientLiquidity
        );

        // Transfer tokens from pool vault to borrower
        let seeds = &[
            b"lending_pool",
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.borrower_token_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        pool.total_borrowed += amount;

        Ok(())
    }

    /// Repay to lending pool (called by borrowing contract via CPI)
    pub fn repay_to_pool(
        ctx: Context<RepayToPool>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.lending_pool;

        // Transfer tokens from repayer to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.repayer_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.repayer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        pool.total_borrowed = pool.total_borrowed.saturating_sub(amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLendingPool<'info> {
    #[account(
        init,
        payer = authority,
        space = LendingPool::LEN,
        seeds = [b"lending_pool", token_mint.key().as_ref()],
        bump
    )]
    pub lending_pool: Account<'info, LendingPool>,
    
    /// CHECK: Token mint for the pool
    pub token_mint: AccountInfo<'info>,
    
    #[account(
        constraint = pool_vault.mint == token_mint.key(),
        constraint = pool_vault.owner == lending_pool.key()
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositIntoLendingPool<'info> {
    #[account(mut)]
    pub lending_pool: Account<'info, LendingPool>,
    
    #[account(
        init_if_needed,
        payer = depositor,
        space = DepositorAccount::LEN,
        seeds = [b"depositor", depositor.key().as_ref(), lending_pool.key().as_ref()],
        bump
    )]
    pub depositor_account: Account<'info, DepositorAccount>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == lending_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key(),
        constraint = depositor_token_account.mint == lending_pool.token_mint
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFromLendingPool<'info> {
    #[account(mut)]
    pub lending_pool: Account<'info, LendingPool>,
    
    #[account(
        mut,
        seeds = [b"depositor", depositor.key().as_ref(), lending_pool.key().as_ref()],
        bump,
        constraint = depositor_account.depositor == depositor.key()
    )]
    pub depositor_account: Account<'info, DepositorAccount>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == lending_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key(),
        constraint = depositor_token_account.mint == lending_pool.token_mint
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BorrowFromPool<'info> {
    #[account(mut)]
    pub lending_pool: Account<'info, LendingPool>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == lending_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayToPool<'info> {
    #[account(mut)]
    pub lending_pool: Account<'info, LendingPool>,
    
    #[account(
        mut,
        constraint = pool_vault.key() == lending_pool.pool_vault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub repayer_token_account: Account<'info, TokenAccount>,
    
    pub repayer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct LendingPool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub pool_vault: Pubkey,
    pub total_deposits: u64,
    pub total_borrowed: u64,
    pub interest_rate: u64, // in basis points
    pub min_deposit: u64,
    pub bump: u8,
}

impl LendingPool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct DepositorAccount {
    pub depositor: Pubkey,
    pub lending_pool: Pubkey,
    pub deposited_amount: u64,
    pub deposit_timestamp: i64,
}

impl DepositorAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8;
}

#[event]
pub struct LendingPoolInitialized {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub interest_rate: u64,
}

#[event]
pub struct DepositMade {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub total_deposits: u64,
}

#[event]
pub struct WithdrawalMade {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub total_deposits: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount is too small")]
    DepositTooSmall,
    
    #[msg("Invalid amount specified")]
    InvalidAmount,
    
    #[msg("Insufficient deposit balance")]
    InsufficientDeposit,
    
    #[msg("Insufficient liquidity in the pool")]
    InsufficientLiquidity,
}
