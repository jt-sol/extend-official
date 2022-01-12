use solana_program::{
    account_info::{AccountInfo, next_account_info},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    msg,
    program::{invoke, invoke_signed},
    program_pack::Pack,
    system_instruction, system_program,
    rent::Rent,
    sysvar::{Sysvar, rent},
};
use spl_associated_token_account;
use spl_token;

use crate::{
    instruction::InitVoucherSystemArgs,
    state::{
        NEIGHBORHOOD_SIZE,
        NEIGHBORHOOD_METADATA_SEED,
        VOUCHER_MINT_SEED,
        VOUCHER_SINK_SEED,
        NeighborhoodMetadata,
    },
    validation_utils::{assert_keys_equal, assert_is_ata},
};

pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: &InitVoucherSystemArgs,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let base = next_account_info(account_info_iter)?;
    let neighborhood_metadata = next_account_info(account_info_iter)?;
    let creator = next_account_info(account_info_iter)?;
    let voucher_mint_auth = next_account_info(account_info_iter)?;
    let voucher_mint = next_account_info(account_info_iter)?;
    let source_ata_voucher = next_account_info(account_info_iter)?;
    let sink_account_voucher = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let associated_token_program = next_account_info(account_info_iter)?;
    let rent_sysvar_info = next_account_info(account_info_iter)?;
    
    let rent = &Rent::from_account_info(rent_sysvar_info)?;

    if !creator.is_signer {
        msg!("Error: Missing signer");
        return Err(ProgramError::MissingRequiredSignature);
    }
    if !voucher_mint_auth.is_signer {
        msg!("Error: Missing signer");
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // check programs
    assert_keys_equal(system_program::id(), *system_program.key)?;
    assert_keys_equal(spl_token::id(), *token_program.key)?;
    assert_keys_equal(spl_associated_token_account::id(), *associated_token_program.key)?;
    assert_keys_equal(rent::id(), *rent_sysvar_info.key)?;
    
    // deserialize and verify neighborhood metadata
    let neighborhood_metadata_data: NeighborhoodMetadata = try_from_slice_unchecked(&neighborhood_metadata.data.borrow())?;
    let seeds_neighborhood_metadata = &[
        &base.key.to_bytes(),
        NEIGHBORHOOD_METADATA_SEED,
        &args.neighborhood_x.to_le_bytes(),
        &args.neighborhood_y.to_le_bytes(),
        &[neighborhood_metadata_data.bump],
    ];
    let key = Pubkey::create_program_address(seeds_neighborhood_metadata, program_id)?;
    assert_keys_equal(key, *neighborhood_metadata.key)?;

    // verify voucher mint
    let seeds_voucher_mint = &[
        &base.key.to_bytes(),
        VOUCHER_MINT_SEED,
        &args.neighborhood_x.to_le_bytes(),
        &args.neighborhood_y.to_le_bytes(),
    ];
    let (key, bump_voucher_mint) = 
        Pubkey::find_program_address(seeds_voucher_mint, program_id);
    assert_keys_equal(key, *voucher_mint.key)?;
    let seeds_voucher_mint = &[
        &base.key.to_bytes(),
        VOUCHER_MINT_SEED,
        &args.neighborhood_x.to_le_bytes(),
        &args.neighborhood_y.to_le_bytes(),
        &[bump_voucher_mint],
    ];

    // verify sink account
    let seeds_sink_account = &[
        &base.key.to_bytes(),
        VOUCHER_SINK_SEED,
        &args.neighborhood_x.to_le_bytes(),
        &args.neighborhood_y.to_le_bytes(),
    ];
    let (key, bump_voucher_sink) = 
        Pubkey::find_program_address(seeds_sink_account, program_id);
    assert_keys_equal(key, *sink_account_voucher.key)?;
    let seeds_sink_account = &[
        &base.key.to_bytes(),
        VOUCHER_SINK_SEED,
        &args.neighborhood_x.to_le_bytes(),
        &args.neighborhood_y.to_le_bytes(),
        &[bump_voucher_sink],
    ];

    // create voucher token mint
    let mint_len = spl_token::state::Mint::LEN;
    let required_lamports = rent
        .minimum_balance(mint_len)
        .max(1)
        .saturating_sub(voucher_mint.lamports());
    invoke_signed(
        &system_instruction::create_account(
            creator.key,
            voucher_mint.key,
            required_lamports,
            mint_len as u64,
            token_program.key,
        ),
        &[
            creator.clone(),
            voucher_mint.clone(),
            system_program.clone(),
        ],
        &[seeds_voucher_mint],
    )?;
    msg!("created voucher token mint");

    // initialize voucher token mint
    invoke_signed(
        &spl_token::instruction::initialize_mint(
            token_program.key, 
            voucher_mint.key, 
            voucher_mint_auth.key, 
            Some(voucher_mint_auth.key), 
            0
        )?,
        &[
            voucher_mint.clone(),            
            rent_sysvar_info.clone(),
            token_program.clone()
        ],
        &[seeds_voucher_mint]
    )?;
    msg!("initialized voucher token mint");

    // create and verify source ATA for voucher token
    invoke(
        &spl_associated_token_account::create_associated_token_account(
            creator.key,
            voucher_mint_auth.key,
            voucher_mint.key,
        ),
        &[
            creator.clone(),
            voucher_mint.clone(),
            voucher_mint_auth.clone(),
            source_ata_voucher.clone(),
            system_program.clone(),
            token_program.clone(),
            rent_sysvar_info.clone(),
            associated_token_program.clone(),
        ],
    )?;
    assert_is_ata(source_ata_voucher, voucher_mint_auth.key, voucher_mint.key)?;
    msg!("created source ATA");

    // check if creator matches
    if !(neighborhood_metadata_data.creator == *creator.key) {
        msg!("Error: only neighborhood creator can initialize voucher system");
        return Err(ProgramError::IllegalOwner);
    }

    // create sink account for voucher token
    let required_lamports = rent
        .minimum_balance(spl_token::state::Account::LEN)
        .max(1)
        .saturating_sub(sink_account_voucher.lamports());
    invoke_signed(
        &system_instruction::create_account(
            creator.key, 
            sink_account_voucher.key, 
            required_lamports, 
            spl_token::state::Account::LEN as u64,
            token_program.key,
        ), 
        &[
            creator.clone(),
            sink_account_voucher.clone(),
            system_program.clone(),
        ], 
        &[seeds_sink_account],
    )?;
    msg!("created sink account");
    
    // initalize token account
    invoke_signed(
        &spl_token::instruction::initialize_account(
            token_program.key, 
            sink_account_voucher.key, 
            voucher_mint.key, 
            system_program.key,
        )?, 
        &[
            token_program.clone(),
            sink_account_voucher.clone(),
            voucher_mint.clone(),
            system_program.clone(),
            rent_sysvar_info.clone()
        ], 
        &[seeds_sink_account],
    )?;
    msg!("initialized sink account");

    // mint 40k to source ATA
    invoke(
        &spl_token::instruction::mint_to(
            token_program.key,
            voucher_mint.key, 
            source_ata_voucher.key,
            voucher_mint_auth.key, 
            &[], 
            (NEIGHBORHOOD_SIZE * NEIGHBORHOOD_SIZE) as u64,
        )?, 
        &[
            token_program.clone(), 
            voucher_mint.clone(), 
            source_ata_voucher.clone(), 
            voucher_mint_auth.clone()
        ]
    )?;
    msg!("minted to source account");

    Ok(())
}