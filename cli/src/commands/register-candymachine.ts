import {Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction,} from "@solana/web3.js";
import {COLOR_BASE_KEY} from "../helpers/constants";
import {sendTransactionWithRetryWithKeypair} from "../helpers/transactions";
import {COLOR_PROGRAM_ID, VOUCHER_TOKEN_MINT} from "../../../client/src/constants";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID,} from "@solana/spl-token";
import BN from "bn.js";

export async function register_candymachine(
  connection: Connection,
  wallet: Keypair,
  candyMachine: PublicKey,
  neighborhoodRow: number,
  neighborhoodCol: number
): Promise<any> {
  const [clusterDataAddress, clusterDataBump] =
    await PublicKey.findProgramAddress(
      [
        COLOR_BASE_KEY.toBuffer(),
        Buffer.from("neighborhood_metadata"),
        Buffer.from(new BN(neighborhoodRow).toArray("le", 8)),
        Buffer.from(new BN(neighborhoodCol).toArray("le", 8)),
      ],
      COLOR_PROGRAM_ID
    );

  const payerATA = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    VOUCHER_TOKEN_MINT,
    wallet.publicKey,
    false
  );

  const colorInstruction = new TransactionInstruction({
    programId: COLOR_PROGRAM_ID,
    keys: [
      { pubkey: COLOR_BASE_KEY, isSigner: false, isWritable: false },
      { pubkey: clusterDataAddress, isSigner: false, isWritable: true },
      { pubkey: candyMachine, isSigner: false, isWritable: false },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: payerATA, isSigner: false, isWritable: true },
      { pubkey: VOUCHER_TOKEN_MINT, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([0]),
      Buffer.from(new BN(neighborhoodRow).toArray("le", 8)),
      Buffer.from(new BN(neighborhoodCol).toArray("le", 8)),
      Buffer.from(new BN(clusterDataBump).toArray("le", 1)),
      Buffer.from(new BN(1).toArray("le", 8)),
    ]),
  });

  return await sendTransactionWithRetryWithKeypair(
    connection,
    wallet,
    [colorInstruction],
    []
  );
}
