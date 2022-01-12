import {Cluster, clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Transaction,} from "@solana/web3.js";
import assert from "assert";
import {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID,} from "@solana/spl-token";

import * as anchor from "@project-serum/anchor";
import * as BufferLayout from "buffer-layout";

const splToken = require("@solana/spl-token");

const publicKey = (property: string = "publicKey"): Object => {
  return BufferLayout.blob(32, property);
};

const uint64 = (property: string = "uint64"): Object => {
  return BufferLayout.blob(8, property);
};

const AccountLayout: typeof BufferLayout.Structure = BufferLayout.struct([
  publicKey("mint"),
  publicKey("owner"),
  uint64("amount"),
  BufferLayout.u32("delegateOption"),
  publicKey("delegate"),
  BufferLayout.u8("state"),
  BufferLayout.u32("isNativeOption"),
  uint64("isNative"),
  uint64("delegatedAmount"),
  BufferLayout.u32("closeAuthorityOption"),
  publicKey("closeAuthority"),
]);

function fromBuffer(buffer) {
  assert(buffer.length === 8, `Invalid buffer length: ${buffer.length}`);
  return [...buffer]
    .reverse()
    .map((i) => `00${i.toString(16)}`.slice(-2))
    .join("");
}

function parseAccountData(data) {
  const accountInfo = AccountLayout.decode(data);
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = parseInt(fromBuffer(accountInfo.amount));

  if (accountInfo.delegateOption === 0) {
    accountInfo.delegate = null;
    accountInfo.delegatedAmount = 0;
  } else {
    accountInfo.delegate = new PublicKey(accountInfo.delegate);
    accountInfo.delegatedAmount = parseInt(
      fromBuffer(accountInfo.delegatedAmount)
    );
  }

  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  if (accountInfo.isNativeOption === 1) {
    accountInfo.rentExemptReserve = parseInt(fromBuffer(accountInfo.isNative));
    accountInfo.isNative = true;
  } else {
    accountInfo.rentExemptReserve = null;
    accountInfo.isNative = false;
  }

  if (accountInfo.closeAuthorityOption === 0) {
    accountInfo.closeAuthority = null;
  } else {
    accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
  }

  return accountInfo;
}

async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
}

export async function send_all_nfts(
  userSignature: anchor.web3.Keypair,
  destinationAddress: PublicKey,
  env: string,
  dry: boolean
): Promise<any[]> {
  const connection = new Connection(clusterApiUrl(env as Cluster), "confirmed");
  const userAccounts = await connection.getTokenAccountsByOwner(
    userSignature.publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  const res = userAccounts.value
    .map((el) => parseAccountData(el.account.data))
    .filter((el) => (el.amount === 1));

  console.log(`This account has ${res.length} NFTS`);

  if (!dry) {
    for (const el of res) {
      const ata_sender = await findAssociatedTokenAddress(
        userSignature.publicKey,
        el.mint
      );
      const ata_dest = await findAssociatedTokenAddress(
        destinationAddress,
        el.mint
      );

      // console.log(findAssociatedTokenAddress(destinationAddress, el.mint));
      const transaction = new Transaction();

      const resp = await connection.getAccountInfo(ata_dest);

      if (resp === null) {
        transaction.add(
          splToken.Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            el.mint,
            ata_dest,
            destinationAddress,
            userSignature.publicKey
          )
        );
      }

      transaction.add(
        splToken.Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          ata_sender,
          ata_dest,
          userSignature.publicKey,
          [],
          1
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [userSignature],
        { commitment: "confirmed" }
      );
      console.log("SIGNATURE", signature);
    }
  }
  return [];
}
