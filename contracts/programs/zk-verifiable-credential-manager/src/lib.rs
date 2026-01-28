use anchor_lang::prelude::*;

declare_id!("CrEd11111111111111111111111111111111111111");

#[program]
pub mod zk_verifiable_credential_manager {
    use super::*;

    /// Store ZK-TLS proof and public output for a user
    pub fn store_zk_tls_proof_and_public_output(
        ctx: Context<StoreZkTlsProof>,
        proof_data: Vec<u8>,
        public_output: Vec<u8>,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let credential = &mut ctx.accounts.credential;
        
        require!(
            proof_data.len() <= MAX_PROOF_SIZE,
            ErrorCode::ProofTooLarge
        );
        require!(
            public_output.len() <= MAX_OUTPUT_SIZE,
            ErrorCode::OutputTooLarge
        );

        credential.owner = ctx.accounts.owner.key();
        credential.proof_data = proof_data;
        credential.public_output = public_output;
        credential.proof_hash = proof_hash;
        credential.timestamp = Clock::get()?.unix_timestamp;
        credential.is_verified = false;
        credential.bump = ctx.bumps.credential;

        emit!(ZkTlsProofStored {
            owner: credential.owner,
            proof_hash,
            timestamp: credential.timestamp,
        });

        Ok(())
    }

    /// Get ZK-TLS proof and public output for a user
    pub fn get_zk_tls_proof_and_public_output(
        _ctx: Context<GetZkTlsProof>,
    ) -> Result<()> {
        // This is a view function - data is read from the account
        // The actual data retrieval happens off-chain by reading the account
        Ok(())
    }

    /// Verify and mark credential as verified (only authority can call)
    pub fn verify_credential(
        ctx: Context<VerifyCredential>,
    ) -> Result<()> {
        let credential = &mut ctx.accounts.credential;
        credential.is_verified = true;

        emit!(CredentialVerified {
            owner: credential.owner,
            proof_hash: credential.proof_hash,
        });

        Ok(())
    }

    /// Revoke a credential
    pub fn revoke_credential(
        ctx: Context<RevokeCredential>,
    ) -> Result<()> {
        let credential = &mut ctx.accounts.credential;
        credential.is_verified = false;

        emit!(CredentialRevoked {
            owner: credential.owner,
            proof_hash: credential.proof_hash,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(proof_data: Vec<u8>, public_output: Vec<u8>, proof_hash: [u8; 32])]
pub struct StoreZkTlsProof<'info> {
    #[account(
        init,
        payer = owner,
        space = ZkCredential::space(&proof_data, &public_output),
        seeds = [b"credential", owner.key().as_ref(), &proof_hash],
        bump
    )]
    pub credential: Account<'info, ZkCredential>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetZkTlsProof<'info> {
    #[account(
        seeds = [b"credential", owner.key().as_ref(), &credential.proof_hash],
        bump = credential.bump
    )]
    pub credential: Account<'info, ZkCredential>,
    
    /// CHECK: This account is only read from
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct VerifyCredential<'info> {
    #[account(mut)]
    pub credential: Account<'info, ZkCredential>,
    
    #[account(constraint = authority.key() == AUTHORITY_PUBKEY @ ErrorCode::UnauthorizedVerifier)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    #[account(
        mut,
        constraint = credential.owner == owner.key() @ ErrorCode::UnauthorizedRevocation
    )]
    pub credential: Account<'info, ZkCredential>,
    
    pub owner: Signer<'info>,
}

#[account]
pub struct ZkCredential {
    /// Owner of the credential
    pub owner: Pubkey,
    
    /// ZK-TLS proof data
    pub proof_data: Vec<u8>,
    
    /// Public output from the proof
    pub public_output: Vec<u8>,
    
    /// Hash of the proof for quick verification
    pub proof_hash: [u8; 32],
    
    /// Timestamp when the credential was stored
    pub timestamp: i64,
    
    /// Whether the credential has been verified
    pub is_verified: bool,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl ZkCredential {
    pub fn space(proof_data: &[u8], public_output: &[u8]) -> usize {
        8 + // discriminator
        32 + // owner
        4 + proof_data.len() + // proof_data (Vec prefix + data)
        4 + public_output.len() + // public_output (Vec prefix + data)
        32 + // proof_hash
        8 + // timestamp
        1 + // is_verified
        1 // bump
    }
}

#[event]
pub struct ZkTlsProofStored {
    pub owner: Pubkey,
    pub proof_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct CredentialVerified {
    pub owner: Pubkey,
    pub proof_hash: [u8; 32],
}

#[event]
pub struct CredentialRevoked {
    pub owner: Pubkey,
    pub proof_hash: [u8; 32],
}

#[error_code]
pub enum ErrorCode {
    #[msg("Proof data exceeds maximum allowed size")]
    ProofTooLarge,
    
    #[msg("Public output exceeds maximum allowed size")]
    OutputTooLarge,
    
    #[msg("Unauthorized verifier")]
    UnauthorizedVerifier,
    
    #[msg("Unauthorized revocation attempt")]
    UnauthorizedRevocation,
}

// Constants
pub const MAX_PROOF_SIZE: usize = 10240; // 10KB
pub const MAX_OUTPUT_SIZE: usize = 2048; // 2KB

// Authority public key (replace with actual authority)
pub const AUTHORITY_PUBKEY: Pubkey = Pubkey::new_from_array([0; 32]);
