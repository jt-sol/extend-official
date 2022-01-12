use borsh::{BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    program::invoke,
    pubkey::Pubkey,
    msg,
    system_instruction, system_program,
    sysvar::rent::Rent,
};

use crate::{
    instruction::InitBaseArgs,
    state::{
        BASE_RESERVE,
        NEIGHBORHOOD_LIST_SEED,
        NEIGHBORHOOD_LIST_RESERVE,
        Base,
        NeighborhoodList,
    },
    validation_utils::{assert_keys_equal},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _args: &InitBaseArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let base = next_account_info(account_info_iter)?;
    let neighborhood_list = next_account_info(account_info_iter)?;
    let payer = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // check programs
    assert_keys_equal(system_program::id(), *system_program.key)?;

    // check base is a signer
    if !base.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // verify neighborhood list account
    let seeds_neighborhood_list = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_LIST_SEED,
    ];
    let (key, bump_neighborhood_list) =
        Pubkey::find_program_address(seeds_neighborhood_list, program_id);
    assert_keys_equal(key, *neighborhood_list.key)?;
    let seeds_neighborhood_list = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_LIST_SEED,
        &[bump_neighborhood_list],
    ];

    // create base account
    let required_lamports = Rent::default()
        .minimum_balance(BASE_RESERVE)
        .max(1)
        .saturating_sub(base.lamports());
    invoke(
        &system_instruction::create_account(
            payer.key,
            base.key,
            required_lamports,
            BASE_RESERVE as u64,
            program_id,
        ),
        &[
            payer.clone(),
            base.clone(),
            system_program.clone(),
        ],
    )?;
    msg!("created base");

    // create neighborhood list account
    let required_lamports = Rent::default()
        .minimum_balance(NEIGHBORHOOD_LIST_RESERVE)
        .max(1)
        .saturating_sub(neighborhood_list.lamports());
    solana_program::program::invoke_signed(
        &system_instruction::create_account(
            payer.key,
            neighborhood_list.key,
            required_lamports,
            NEIGHBORHOOD_LIST_RESERVE as u64,
            program_id,
        ),
        &[
            payer.clone(),
            neighborhood_list.clone(),
            system_program.clone(),
        ],
        &[seeds_neighborhood_list],
    )?;

    msg!("created neighborhood list account");

    // write to base
    let mut base_data: Base = try_from_slice_unchecked(&base.data.borrow_mut())?;
    base_data.neighborhood_count = 0;
    base_data.authority = *payer.key;
    base_data.authority_privileges = true;
    base_data.serialize(&mut *base.data.borrow_mut())?;

    let mut neighborhood_list_data: NeighborhoodList = try_from_slice_unchecked(&neighborhood_list.data.borrow_mut())?;
    neighborhood_list_data.bump = bump_neighborhood_list;
    neighborhood_list_data.serialize(&mut *neighborhood_list.data.borrow_mut())?;

    Ok(())
}
