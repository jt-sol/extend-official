use borsh::{BorshSerialize};
use metaplex_token_metadata::state::Metadata;
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    system_instruction, system_program,
    sysvar::rent::Rent,
};

use crate::{
    error::CustomError,
    instruction::InitSpaceMetadataArgs,
    processor::processor_utils::{get_neighborhood_xy, get_space_xy_from_name},
    state::{
        NEIGHBORHOOD_METADATA_SEED,
        SPACE_METADATA_SEED,
        SPACE_METADATA_RESERVE,
        NeighborhoodMetadata,
        SpaceMetadata,
    },
    validation_utils::{assert_is_ata, assert_keys_equal},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: &InitSpaceMetadataArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let base = next_account_info(account_info_iter)?;
    let space_metaplex_metadata = next_account_info(account_info_iter)?;
    let space_metadata = next_account_info(account_info_iter)?;
    let space_mint = next_account_info(account_info_iter)?;
    let neighborhood_metadata = next_account_info(account_info_iter)?;
    let space_owner = next_account_info(account_info_iter)?;
    let space_ata = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !space_owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // check programs
    assert_keys_equal(system_program::id(), *system_program.key)?;

    // deserialize and verify neighborhood metadata
    let neighborhood_metadata_data: NeighborhoodMetadata = try_from_slice_unchecked(&neighborhood_metadata.data.borrow())?;
    let (neighborhood_x, neighborhood_y) = get_neighborhood_xy(args.space_x, args.space_y);
    let seeds_neighborhood_metadata = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_METADATA_SEED,
        &neighborhood_x.to_le_bytes(),
        &neighborhood_y.to_le_bytes(),
        &[neighborhood_metadata_data.bump],
    ];

    let neighborhood_key = Pubkey::create_program_address(seeds_neighborhood_metadata, program_id)?;
    assert_keys_equal(neighborhood_key, *neighborhood_metadata.key)?;

    // verify space metadata
    let seeds_space_metadata = &[
        &base.key.to_bytes(),
        SPACE_METADATA_SEED,
        &args.space_x.to_le_bytes(),
        &args.space_y.to_le_bytes(),
    ];
    let (key, space_bump) = Pubkey::find_program_address(seeds_space_metadata, program_id);
    assert_keys_equal(key, *space_metadata.key)?;
    let seeds_space_metadata = &[
        &base.key.to_bytes(),
        SPACE_METADATA_SEED,
        &args.space_x.to_le_bytes(),
        &args.space_y.to_le_bytes(),
        &[space_bump],
    ];

    // deserialize and verify metaplex metadata
    let (metadata_key, _) = Pubkey::find_program_address(
        &[
            b"metadata",
            metaplex_token_metadata::id().as_ref(),
            space_mint.key.as_ref(),
        ],
        &metaplex_token_metadata::id(),
    );
    assert_keys_equal(metadata_key, *space_metaplex_metadata.key)?;
    let space_metaplex_metadata_data = Metadata::from_account_info(
        space_metaplex_metadata,
    )?;

    // check ATAs
    assert_is_ata(space_ata, space_owner.key, space_mint.key)?;

    // check owns token
    let ata_account_info = spl_token::state::Account::unpack_from_slice(&space_ata.data.borrow())?;
    if ata_account_info.amount != 1 {
        msg!("Error: token account does not own token");
        return Err(CustomError::MissingTokenOwner.into());
    }

    // check x and y consistent with space name 
    let (x, y) = get_space_xy_from_name(&space_metaplex_metadata_data.data.name);
    if x != args.space_x || y != args.space_y{
        msg!("space x and y don't match metaplex metadata");
        return Err(ProgramError::InvalidInstructionData);
    }

    let creators = space_metaplex_metadata_data.data.creators.unwrap();
    
    // check nft candymachine is the neighborhood's candymachine
    let candymachine_account = &creators[0].address;
    assert_keys_equal(*candymachine_account, neighborhood_metadata_data.candymachine_account)?;

    // check candymachine is verified
    let verified = &creators[0].verified;
    if !verified {
        msg!("Candy machine is not verified.");
        return Err(ProgramError::InvalidAccountData);
    }

    // create the space metadata account
    let required_lamports = Rent::default()
        .minimum_balance(SPACE_METADATA_RESERVE)
        .max(1)
        .saturating_sub(space_metadata.lamports());
    invoke_signed(
        &system_instruction::create_account(
            space_owner.key,
            space_metadata.key,
            required_lamports,
            SPACE_METADATA_RESERVE as u64,
            program_id,
        ),
        &[
            space_owner.clone(),
            space_metadata.clone(),
            system_program.clone(),
        ],
        &[seeds_space_metadata],
    )?;

    // write to space metadata
    let mut space_metadata_data: SpaceMetadata = try_from_slice_unchecked(&space_metadata.data.borrow_mut())?;
    space_metadata_data.bump = space_bump;
    space_metadata_data.mint = *space_mint.key;
    space_metadata_data.space_x = x;
    space_metadata_data.space_y = y;
    space_metadata_data.serialize(&mut *space_metadata.data.borrow_mut())?;
    Ok(())
}