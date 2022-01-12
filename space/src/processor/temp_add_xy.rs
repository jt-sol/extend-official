use borsh::{BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::ProgramResult,
    borsh::try_from_slice_unchecked,
    msg,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
};
use spl_token;

use crate::{
    error::CustomError,
    instruction::TempAddxyArgs,
    state::{
        SPACE_METADATA_SEED,
        SpaceMetadata,
    },
    validation_utils::{assert_is_ata, assert_keys_equal},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: &TempAddxyArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let space_metadata = next_account_info(account_info_iter)?;
    let ata_account = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    //deserialize and verify space metadata
    let mut space_metadata_data: SpaceMetadata = try_from_slice_unchecked(&space_metadata.data.borrow_mut())?;

    let seeds_space_metadata = &[
        &base.key.to_bytes(),
        SPACE_METADATA_SEED,
        &args.space_x.to_le_bytes(),
        &args.space_y.to_le_bytes(),
        &[space_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_space_metadata, program_id)?;
    assert_keys_equal(key, *space_metadata.key)?;


    //check ATAs
    assert_is_ata(ata_account, owner.key, &space_metadata_data.mint)?;

    // check NFT owned
    let ata_data = spl_token::state::Account::unpack_from_slice(&ata_account.data.borrow())?;
    if ata_data.amount != 1 {
        msg!("Error: token account does not own token");
        return Err(CustomError::MissingTokenOwner.into());
    }

    space_metadata_data.space_x = args.space_x;
    space_metadata_data.space_y = args.space_y;

    space_metadata_data.serialize(&mut *space_metadata.data.borrow_mut())?;

    Ok(())
}
