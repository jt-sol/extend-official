import {Keypair, PublicKey, SystemProgram, TransactionInstruction,} from "@solana/web3.js";
import {Schema, serialize} from "borsh";
import {SPACE_PROGRAM_ID, NEIGHBORHOOD_LIST_SEED} from "../constants";

export class InitBaseArgs {
    instruction: number = 0;
  
    static schema: Schema = new Map([
      [
        InitBaseArgs,
        {
          kind: "struct",
          fields: [
            ["instruction", "u8"],
          ],
        },
      ],
    ]);
  }


  export const initBaseInstruction = async (
    wallet : any,
    base: PublicKey,
  ) => {
    const [neighborhoodList,] =
    await PublicKey.findProgramAddress(
      [
        base.toBuffer(),
        Buffer.from(NEIGHBORHOOD_LIST_SEED),
      ],
      SPACE_PROGRAM_ID
    );
  
    const keys = [
      {
        pubkey: base,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: neighborhoodList,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ];
    const args = new InitBaseArgs();
    const data = Buffer.from(serialize(InitBaseArgs.schema, args));
    let Ix = 
      [new TransactionInstruction({
        keys,
        programId: SPACE_PROGRAM_ID,
        data,
      })];
  
    return Ix;
  };
  