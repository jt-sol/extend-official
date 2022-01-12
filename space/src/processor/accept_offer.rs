use borsh::{BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::ProgramResult,
    borsh::try_from_slice_unchecked,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    system_instruction,
    system_program,
    sysvar::{rent},
};
use spl_associated_token_account;
use spl_token;

use crate::{
    error::CustomError,
    instruction::AcceptOfferArgs,
    state::{
        MARKETPLACE_FEE,
        NEIGHBORHOOD_METADATA_SEED,
        SPACE_METADATA_SEED,
        SELL_DELEGATE_SEED,
        NeighborhoodMetadata,
        SpaceMetadata,
    },
    validation_utils::{assert_is_ata, assert_keys_equal},
    processor::processor_utils::{get_neighborhood_xy},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: &AcceptOfferArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let neighborhood_metadata = next_account_info(account_info_iter)?;
    let neighborhood_creator = next_account_info(account_info_iter)?;
    let space_metadata = next_account_info(account_info_iter)?;
    let space_mint = next_account_info(account_info_iter)?;
    let alice = next_account_info(account_info_iter)?;
    let alice_ata_space = next_account_info(account_info_iter)?;
    let bob = next_account_info(account_info_iter)?;
    let bob_ata_space = next_account_info(account_info_iter)?;
    let sell_delegate = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let associated_token_program = next_account_info(account_info_iter)?;
    let rent_program = next_account_info(account_info_iter)?;

    // check programs
    assert_keys_equal(system_program::id(), *system_program.key)?;
    assert_keys_equal(spl_token::id(), *token_program.key)?;
    assert_keys_equal(spl_associated_token_account::id(), *associated_token_program.key)?;
    assert_keys_equal(rent::id(), *rent_program.key)?;

    //deserialize and verify space metadata
    let mut space_metadata_data: SpaceMetadata = try_from_slice_unchecked(&space_metadata.data.borrow_mut())?;
    
    if space_metadata_data.mint != *space_mint.key {
        msg!("Error: space account does not match mint account");
        return Err(CustomError::MintMismatch.into());
    }

    let seeds_space_metadata = &[
        &base.key.to_bytes(),
        SPACE_METADATA_SEED,
        &args.space_x.to_le_bytes(),
        &args.space_y.to_le_bytes(),
        &[space_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_space_metadata, program_id)?;
    assert_keys_equal(key, *space_metadata.key)?;

    //deserialize and verify neighborhood metadata
    let neighborhood_metadata_data: NeighborhoodMetadata = try_from_slice_unchecked(&neighborhood_metadata.data.borrow_mut())?;
    let (neighborhood_x, neighborhood_y) = get_neighborhood_xy(args.space_x, args.space_y);
    let seeds_neighborhood_metadata = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_METADATA_SEED,
        &neighborhood_x.to_le_bytes(),
        &neighborhood_y.to_le_bytes(),
        &[neighborhood_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_neighborhood_metadata, program_id)?;
    assert_keys_equal(key, *neighborhood_metadata.key)?;

    // verify sell_delegate
    let seeds_sell_delegate = &[&base.key.to_bytes(), SELL_DELEGATE_SEED];
    let (key, bump_sell_delegate) = Pubkey::find_program_address(seeds_sell_delegate, program_id);
    assert_keys_equal(key, *sell_delegate.key)?;
    let seeds_sell_delegate = &[&base.key.to_bytes(), SELL_DELEGATE_SEED, &[bump_sell_delegate]];

    // create ATA if necessary
    if alice_ata_space.data_len() == 0 {
        invoke(
            &spl_associated_token_account::create_associated_token_account(
                alice.key,
                alice.key,
                space_mint.key,
            ),
            &[
                alice.clone(),
                space_mint.clone(),
                alice_ata_space.clone(),
                system_program.clone(),
                token_program.clone(),
                rent_program.clone(),
                associated_token_program.clone(),
            ],
        )?;
    }
    
    // check ATAs
    assert_is_ata(alice_ata_space, alice.key, space_mint.key)?;
    assert_is_ata(bob_ata_space, bob.key, space_mint.key)?;

    // check neighborhood creator is passed in correctly
    assert_keys_equal(neighborhood_metadata_data.creator, *neighborhood_creator.key)?;

    // check that B is listed
    let bob_ata_space_data = spl_token::state::Account::unpack(&bob_ata_space.data.borrow())?;
    if !bob_ata_space_data.delegate.contains(sell_delegate.key) {
        msg!("Error: token not listed");
        return Err(ProgramError::InvalidAccountData);
    }

    // check user price equals true price
    if space_metadata_data.price != args.price {
        msg!("space metadata price is {}",space_metadata_data.price);
        msg!("args price is {}",args.price);
        msg!("Error: listing has changed");
        return Err(ProgramError::InvalidInstructionData);
    }

    // transfer NFT from bob to alice
    invoke_signed(
        &spl_token::instruction::transfer(
            token_program.key,
            bob_ata_space.key,
            alice_ata_space.key,
            sell_delegate.key,
            &[],
            1,
        )?,
        &[
            token_program.clone(),
            bob_ata_space.clone(),
            alice_ata_space.clone(),
            sell_delegate.clone(),
        ],
        &[seeds_sell_delegate],
    )?;

    let marketplace_fee: u64 = (args.price as f64 * MARKETPLACE_FEE) as u64;
    
    // transfer SOL from alice to bob
    invoke(
        &system_instruction::transfer(
            alice.key,
            bob.key,
            args.price - marketplace_fee,
        ),
        &[
            alice.clone(),
            bob.clone(),
            system_program.clone(),
        ],
    )?;

    // transfer marketplace fee to neighborhood creator
    invoke(
        &system_instruction::transfer(
            alice.key,
            neighborhood_creator.key,
            marketplace_fee,
        ),
        &[
            alice.clone(),
            neighborhood_creator.clone(),
            system_program.clone(),
        ],
    )?;

    space_metadata_data.price = 0;
    space_metadata_data.serialize(&mut *space_metadata.data.borrow_mut())?;

    msg!("done!");
    Ok(())
}
