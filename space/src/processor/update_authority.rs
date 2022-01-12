use borsh::{BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    msg,
};

use crate::{
    instruction::UpdateAuthorityArgs,
    state::Base,
    validation_utils::{assert_keys_equal},
};

pub fn process(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _args: &UpdateAuthorityArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let current_creator = next_account_info(account_info_iter)?;
    let new_creator = next_account_info(account_info_iter)?;

    let mut base_data: Base = try_from_slice_unchecked(&base.data.borrow_mut())?;

    if !current_creator.is_signer {
        msg!("Error: Missing signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // check that revoker is creator of base
    assert_keys_equal(base_data.authority, *current_creator.key)?;


    // write to base
    base_data.authority = *new_creator.key;
    base_data.serialize(&mut *base.data.borrow_mut())?;

    Ok(())
}