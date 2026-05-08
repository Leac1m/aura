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
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 2 + 8 + 1,
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

#[account]
pub struct EscrowState {
    pub owner: Pubkey,
    pub max_slippage: u16,
    pub max_allowance: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
