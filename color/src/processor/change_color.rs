use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
};
use std::str::FromStr;

use crate::{
    error::CustomError,
    instruction::{ChangeColorArgs, ChangeColorBriefArgs},
    state::{
        NEIGHBORHOOD_SIZE,
        NEIGHBORHOOD_METADATA_SEED,
        SPACE_PID,
        SPACE_METADATA_SEED,
        NEIGHBORHOOD_FRAME_BASE_SEED,
        NEIGHBORHOOD_FRAME_POINTER_SEED,
        NeighborhoodMetadata,
        SpaceMetadata,
        NeighborhoodFrameBase,
        NeighborhoodFramePointer,
    },
    processor::processor_utils::{get_neighborhood_xy},
    validation_utils::{assert_is_ata, assert_keys_equal},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: &ChangeColorArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let frame = next_account_info(account_info_iter)?;
    let neighborhood_frame_base = next_account_info(account_info_iter)?;
    let neighborhood_frame_pointer = next_account_info(account_info_iter)?;
    let neighborhood_metadata = next_account_info(account_info_iter)?;
    let space_metadata = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let space_ata = next_account_info(account_info_iter)?;

    // check owner is signer
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    //  deserialize and check all PDAs
    let neighborhood_frame_base_data: NeighborhoodFrameBase =
        try_from_slice_unchecked(&neighborhood_frame_base.data.borrow())?;
    let neighborhood_frame_pointer_data: NeighborhoodFramePointer =
        try_from_slice_unchecked(&neighborhood_frame_pointer.data.borrow())?;
    let neighborhood_metadata_data: NeighborhoodMetadata =
        try_from_slice_unchecked(&neighborhood_metadata.data.borrow())?;
    let space_metadata_data: SpaceMetadata =
        try_from_slice_unchecked(&space_metadata.data.borrow())?;

    let (neighborhood_x, neighborhood_y) = get_neighborhood_xy(args.space_x, args.space_y);
    
    // verify frame base
    let seeds_neighborhood_frame_base = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_FRAME_BASE_SEED,
        &neighborhood_x.to_le_bytes(),
        &neighborhood_y.to_le_bytes(),
        &[neighborhood_frame_base_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_neighborhood_frame_base, program_id)?;
    assert_keys_equal(key, *neighborhood_frame_base.key)?;

    // verify frame pointer
    let seeds_neighborhood_frame_pointer = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_FRAME_POINTER_SEED,
        &neighborhood_x.to_le_bytes(),
        &neighborhood_y.to_le_bytes(),
        &args.frame.to_le_bytes(),
        &[neighborhood_frame_pointer_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_neighborhood_frame_pointer, program_id)?;
    assert_keys_equal(key, *neighborhood_frame_pointer.key)?;
    
    // verify neighborhood metadata
    let seeds_neighborhood_metadata = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_METADATA_SEED,
        &neighborhood_x.to_le_bytes(),
        &neighborhood_y.to_le_bytes(),
        &[neighborhood_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_neighborhood_metadata, &Pubkey::from_str(SPACE_PID).unwrap())?;
    assert_keys_equal(key, *neighborhood_metadata.key)?;

    // verify space metadata
    let seeds_space_metadata = &[
        &base.key.to_bytes(),
        SPACE_METADATA_SEED,
        &args.space_x.to_le_bytes(),
        &args.space_y.to_le_bytes(),
        &[space_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_space_metadata, &Pubkey::from_str(SPACE_PID).unwrap())?;
    assert_keys_equal(key, *space_metadata.key)?;

    // check ATAs
    assert_is_ata(space_ata, owner.key, &space_metadata_data.mint)?;

    // verify token is owned
    let space_ata_data = spl_token::state::Account::unpack_from_slice(&space_ata.data.borrow())?;
    if space_ata_data.amount != 1 {
        msg!("Error: token account does not own token");
        return Err(CustomError::MissingTokenOwner.into());
    }
    
    // verify frame
    if neighborhood_frame_base_data.length <= args.frame {
        msg!("Number of frames is less than frame index");
        return Err(ProgramError::InvalidAccountData);
    }
    assert_keys_equal(
        neighborhood_frame_pointer_data.framekey,
        *frame.key,
    )?;

    // change color
    let mut frame_data = frame.data.borrow_mut();
    let n = NEIGHBORHOOD_SIZE as i64;
    let x_mod = (args.space_x % n + n) % n;
    let y_mod = (args.space_y % n + n) % n;
    let idx = (3 * n * x_mod + 3 * y_mod) as usize;
    frame_data[idx] = args.r;
    frame_data[idx + 1] = args.g;
    frame_data[idx + 2] = args.b;

    Ok(())
}

pub fn process_brief(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args_brief: &ChangeColorBriefArgs,
) -> ProgramResult {

    let args = ChangeColorArgs{
        space_x: args_brief.space_x as i64,
        space_y: args_brief.space_y as i64,
        frame: args_brief.frame as u64,
        r: args_brief.r,
        g: args_brief.g,
        b: args_brief.b,
    };
    process(program_id, accounts, &args)?;
    Ok(())
}


