import {Keypair, PublicKey, SystemProgram, TransactionInstruction,} from "@solana/web3.js";
import {Schema, serialize} from "borsh";
import {SPACE_PROGRAM_ID, NEIGHBORHOOD_LIST_SEED} from "../constants";

export class UpdateAuthorityArgs {
    instruction: number = 7;
  
    static schema: Schema = new Map([
      [
        UpdateAuthorityArgs,
        {
          kind: "struct",
          fields: [
            ["instruction", "u8"],
          ],
        },
      ],
    ]);
  }

  export const updateAuthorityInstruction = async (
    wallet : any,
    base: PublicKey,
    currentAuth: PublicKey,
    newAuth: PublicKey,
  ) => {
  
    const keys = [
      {
        pubkey: base,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: currentAuth,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: newAuth,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ];
    const args = new UpdateAuthorityArgs();
    const data = Buffer.from(serialize(UpdateAuthorityArgs.schema, args));
    let Ix = 
      [new TransactionInstruction({
        keys,
        programId: SPACE_PROGRAM_ID,
        data,
      })];
  
    return Ix;
  };
  