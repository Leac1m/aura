use anchor_lang::prelude::*;

declare_id!("EWtCKe8i6PcCAu933mZSYkWGzPDyhAwKAQyzvTNgP15w");

#[program]
pub mod aura_escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, max_slippage: u16, max_allowance: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.owner = ctx.accounts.user.key();
        escrow.max_slippage = max_slippage;
        escrow.max_allowance = max_allowance;
        escrow.subscription_end = 0;
        escrow.bump = ctx.bumps.escrow;
        msg!("Escrow initialized for owner: {:?}", escrow.owner);
        Ok(())
    }

    pub fn update_guardrails(ctx: Context<UpdateGuardrails>, max_slippage: u16, max_allowance: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.max_slippage = max_slippage;
        escrow.max_allowance = max_allowance;
        msg!("Guardrails updated: slippage={}, allowance={}", max_slippage, max_allowance);
        Ok(())
    }

    pub fn pay_subscription(ctx: Context<PaySubscription>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let user = &ctx.accounts.user;
        let treasury = &ctx.accounts.treasury;

        let amount: u64 = 100_000_000; // 0.1 SOL

        // Transfer 0.1 SOL to treasury
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &user.key(),
                &treasury.key(),
                amount,
            ),
            &[
                user.to_account_info(),
                treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let now = Clock::get()?.unix_timestamp;
        let thirty_days = 30 * 24 * 60 * 60;
        
        // If already active, extend from current end, otherwise from now
        if escrow.subscription_end > now {
            escrow.subscription_end += thirty_days;
        } else {
            escrow.subscription_end = now + thirty_days;
        }

        msg!("Subscription paid. Ends at: {}", escrow.subscription_end);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 2 + 8 + 8 + 1, // Added 8 bytes for subscription_end
        seeds = [b"escrow", user.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGuardrails<'info> {
    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump = escrow.bump,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub escrow: Account<'info, EscrowState>,
    pub owner: Signer<'info>,
    pub user: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct PaySubscription<'info> {
    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, EscrowState>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the treasury address that receives payments
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct EscrowState {
    pub owner: Pubkey,
    pub max_slippage: u16,
    pub max_allowance: u64,
    pub subscription_end: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
