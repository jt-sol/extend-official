use borsh::{BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::{
    instruction::RevokeAuthorityPrivilegesArgs,
    state::Base,
    validation_utils::{assert_keys_equal},
};

pub fn process(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _args: &RevokeAuthorityPrivilegesArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let revoker = next_account_info(account_info_iter)?;

    let mut base_data: Base = try_from_slice_unchecked(&base.data.borrow_mut())?;

    if !revoker.is_signer {
        msg!("Error: Missing signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // check that revoker is creator of base
    assert_keys_equal(base_data.authority, *revoker.key)?;

    // check that currently price exempt
    if !base_data.authority_privileges {
        msg!("Price exempt status already revoked!");
        return Err(ProgramError::InvalidAccountData);
    }

    // write to base
    base_data.authority_privileges = false;
    base_data.serialize(&mut *base.data.borrow_mut())?;

    Ok(())
}