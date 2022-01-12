import { program } from "commander";
import * as path from "path";
import fs from "fs";
import * as anchor from "@project-serum/anchor";
import log from "loglevel";
import { clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import { upload } from "./commands/upload";
import { mint } from "./commands/mint";
import { changeColorInstruction } from "./../../client/src/actions/change_color";
import { acceptOfferInstruction } from "./../../client/src/actions/accept_offer";
import { changeOfferInstruction } from "./../../client/src/actions/change_offer";
import { initSpaceMetadataInstruction } from "./../../client/src/actions/init_space_metadata";
import { sendTransactionWithRetryWithKeypair } from "./helpers/transactions";
import { getMetadata, loadWalletKey } from "./helpers/accounts";
import { decodeMetadata } from "./../../client/src/actions/metadata";
import { loadCache, saveCache } from "./helpers/cache";
import { StorageType } from "./helpers/storage-type";
import { BASE } from "../../client/src/constants";

programCommand("test-mint")
  .option("-r, --creator-signature <string>", "Creator's signature")
  .option("-nx, --neighborhood-row <number>", `Neighborhood x`, undefined)
  .option("-ny, --neighborhood-col <number>", `Neighborhood y`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .action(async (directory, cmd) => {
    const {
      keypair,
      env,
      cacheName,
      creatorSignature,
      neighborhoodRow,
      neighborhoodCol,
      base,
    } = cmd.opts();

    const cacheContent = loadCache(
      neighborhoodRow,
      neighborhoodCol,
      cacheName,
      env
    );
    console.log("candy machine:", cacheContent.candyMachineAddress);
    const configAddress = new PublicKey(cacheContent.program.config);
    const res = await mint(keypair, env, configAddress, creatorSignature);
    log.info("mint_one_token finished", res);

    const walletKeyPair = loadWalletKey(keypair);
    const base_address = base ? new PublicKey(base) : BASE;
    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));

    const mint_cache = {};

    mint_cache["spaceMint"] = new PublicKey(res[1]);
    const metadata_address = await getMetadata(mint_cache["spaceMint"]);
    let account_data = null;
    while (!account_data) {
      account_data = await solConnection.getAccountInfo(metadata_address);
    }
    console.log(account_data.data);
    const nft_metadata = decodeMetadata(account_data.data);
    mint_cache["spaceX"] = parseInt(
      nft_metadata.data.name.split("(")[1].split(",")[0]
    );
    mint_cache["spaceY"] = parseInt(
      nft_metadata.data.name.split("(")[1].split(",")[1].split(")")[0]
    );
    mint_cache["b58"] = mint_cache["spaceMint"].toBase58();

    fs.writeFileSync(`./temp_test/mint.json`, JSON.stringify(mint_cache));
    console.log(JSON.stringify(mint_cache));

    // const space_x = mint_cache["spaceX"];
    // const space_y = mint_cache["spaceY"];

    // log.info("space_x", space_x);
    // log.info("space_y", space_y);

    // // Initialize space
    // const spaceMint = new PublicKey(res[1]);
    // const ixs = await initPixelMetadataInstruction(
    //   walletKeyPair,
    //   base_address,
    //   space_x,
    //   space_y,
    //   spaceMint
    // );
    // log.info("Instructions complete");

    // await sendTransactionWithRetryWithKeypair(
    //   solConnection,
    //   walletKeyPair,
    //   [...ixs],
    //   []
    // );

    // log.debug("Instructions complete");

    // const ixs_color = await changeColorInstruction(
    //   solConnection,
    //   walletKeyPair,
    //   base_address,
    //   space_x,
    //   space_y,
    //   0,
    //   255,
    //   255,
    //   0,
    //   spaceMint
    // );

    // log.debug("Instructions for color change");
    // log.debug(walletKeyPair.publicKey);

    // await sendTransactionWithRetryWithKeypair(
    //   solConnection,
    //   walletKeyPair,
    //   [...ixs_color],
    //   []
    // );

    // log.debug("Instructions for change offer");

    // const ixs_offer = await changeOfferTransaction(
    //   walletKeyPair,
    //   base_address,
    //   spaceMint,
    //   space_x,
    //   space_y,
    //   new BN(1_000_000_000),
    //   true
    // );

    // await sendTransactionWithRetryWithKeypair(
    //   solConnection,
    //   walletKeyPair,
    //   [...ixs_offer],
    //   []
    // );
  });

programCommand("test-upload-folder")
  .option("-nx, --neighborhood-row <number>", `Neighborhood x`, undefined)
  .option("-ny, --neighborhood-col <number>", `Neighborhood y`, undefined)
  .argument(
    "<directory>",
    "Directory containing images named from 0-n",
    (val) => {
      return fs.readdirSync(`${val}`).map((file) => path.join(val, file));
    }
  )
  .option(
    "-s, --storage <string>",
    `Database to use for storage (${Object.values(StorageType).join(", ")})`,
    "arweave"
  )
  .option(
    "--ipfs-infura-project-id <string>",
    "Infura IPFS project id (required if using IPFS)"
  )
  .option(
    "--ipfs-infura-secret <string>",
    "Infura IPFS scret key (required if using IPFS)"
  )
  .option(
    "--aws-s3-bucket <string>",
    "(existing) AWS S3 Bucket name (required if using aws)"
  )
  .option(
    "-jwk, --jwk <string>",
    "Path to Arweave wallet file (required if using Arweave Native)"
  )
  .option("--no-retain-authority", "Do not retain authority to update metadata")
  .option("--no-mutable", "Metadata will not be editable")
  .action(async (files: string[], options, cmd) => {
    const {
      neighborhoodRow,
      neighborhoodCol,
      keypair,
      env,
      cacheName,
      storage,
      ipfsInfuraProjectId,
      ipfsInfuraSecret,
      awsS3Bucket,
      retainAuthority,
      mutable,
      jwk,
    } = cmd.opts();

    if (storage === StorageType.ArweaveNative && !jwk) {
      throw new Error(
        "Path to Arweave JWK wallet file must be provided when using arweave-native"
      );
    }

    if (
      storage === StorageType.Ipfs &&
      (!ipfsInfuraProjectId || !ipfsInfuraSecret)
    ) {
      throw new Error(
        "IPFS selected as storage option but Infura project id or secret key were not provided."
      );
    }
    if (storage === StorageType.Aws && !awsS3Bucket) {
      throw new Error(
        "aws selected as storage option but existing bucket name (--aws-s3-bucket) not provided."
      );
    }

    if (!Object.values(StorageType).includes(storage)) {
      throw new Error(
        `Storage option must either be ${Object.values(StorageType).join(
          ", "
        )}. Got: ${storage}`
      );
    }
    const ipfsCredentials = {
      projectId: ipfsInfuraProjectId,
      secretKey: ipfsInfuraSecret,
    };

    console.log(`Beginning the upload for ${files.length} (png+json) pairs`);

    const startMs = Date.now();
    log.info("started at: " + startMs.toString());
    try {
      await upload({
        files,
        cacheName,
        env,
        keypair,
        storage,
        retainAuthority,
        mutable,
        ipfsCredentials,
        awsS3Bucket,
        jwk,
        neighborhoodRow,
        neighborhoodCol,
      });
    } catch (err) {
      log.warn("upload was not successful, please re-run.", err);
    }

    const endMs = Date.now();
    const timeTaken = new Date(endMs - startMs).toISOString().substr(11, 8);
    log.info(
      `ended at: ${new Date(endMs).toISOString()}. time taken: ${timeTaken}`
    );
  });

programCommand("test-initialize-space")
  .option("-m, --mint <string>", "space mint")
  .option("-sx, --space-row <number>", `Space x`, undefined)
  .option("-sy, --space-col <number>", `Space y`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .action(async (directory, cmd) => {
    const { keypair, env, cacheName, mint, SpaceRow, SpaceCol, base } =
      cmd.opts();

    const walletKeyPair = loadWalletKey(keypair);
    const base_address = base ? new PublicKey(base) : BASE;
    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));
    const spaceMint = new PublicKey(mint);
    const sx = Number(SpaceRow);
    const sy = Number(SpaceCol);

    console.log(sx);
    console.log(sy);
    console.log(spaceMint.toBase58());
    log.debug("Instructions for initialize space metadata");

    const ixs = await initPixelMetadataInstruction(
      walletKeyPair,
      base_address,
      sx,
      sy,
      spaceMint
    );

    await sendTransactionWithRetryWithKeypair(
      solConnection,
      walletKeyPair,
      [...ixs],
      [walletKeyPair]
    );
  });

programCommand("test-change-color")
  .option("-m, --mint <string>", "space mint")
  .option("-sx, --space-row <number>", `Space x`, undefined)
  .option("-sy, --space-col <number>", `Space y`, undefined)
  .option("-r, --red <number>", `Red`, undefined)
  .option("-g, --green <number>", `Green`, undefined)
  .option("-bl, --blue <number>", `Blue`, undefined)
  .option("-f, --frame <number>", `Frame`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .action(async (directory, cmd) => {
    const {
      keypair,
      env,
      cacheName,
      mint,
      spaceRow,
      spaceCol,
      red,
      green,
      blue,
      frame,
      base,
    } = cmd.opts();

    const walletKeyPair = loadWalletKey(keypair);
    const base_address = base ? new PublicKey(base) : BASE;
    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));
    const spaceMint = new PublicKey(mint);
    const px = Number(spaceRow);
    const py = Number(spaceCol);

    log.debug("Instructions for change color");

    const ixs_color = await changeColorInstruction(
      solConnection,
      walletKeyPair,
      base_address,
      { x: px, y: py, frame, r: red, g: green, b: blue, spaceMint : spaceMint }
    );

    await sendTransactionWithRetryWithKeypair(
      solConnection,
      walletKeyPair,
      [...ixs_color],
      [walletKeyPair]
    );
  });

programCommand("test-accept-offer")
  .option("-m, --mint <string>", "space mint")
  .option("-sx, --space-row <number>", `Space x`, undefined)
  .option("-sy, --space-col <number>", `Space y`, undefined)
  .option("-o, --owner <string>", `Owner (bob)`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .action(async (directory, cmd) => {
    const { keypair, env, cacheName, mint, spaceRow, spaceCol, owner, base } =
      cmd.opts();

    const walletKeyPair = loadWalletKey(keypair);
    const base_address = base ? new PublicKey(base) : BASE;
    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));
    const spaceMint = new PublicKey(mint);
    const bob = new PublicKey(owner);
    const sx = Number(spaceRow);
    const sy = Number(spaceCol);

    log.debug("Instructions for accept offer");

    const ixs_accept = await acceptOfferInstruction(
      walletKeyPair,
      base_address,
      { x: sx, y: sy, price: 1_000_000_000, seller: bob, mint: spaceMint }
    );

    await sendTransactionWithRetryWithKeypair(
      solConnection,
      walletKeyPair,
      [...ixs_accept],
      [walletKeyPair]
    );
  });

programCommand("test-change-offer")
  .option("-x, --space-x <number>", `Space x`, undefined)
  .option("-y, --space-y <number>", `Space y`, undefined)
  .option("-f, --frame <number>", `Frame`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .option("-m, --mint <string>", `Mint of NFT`, undefined)
  .action(async (directory, cmd) => {
    const { keypair, env, cacheName, spaceX, spaceY, frame, base, mint } =
      cmd.opts();

    const base_address = base ? new PublicKey(base) : BASE;
    const mint_address = new PublicKey(mint);
    const walletKeyPair = loadWalletKey(keypair);

    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));
    const x = Number(spaceX);
    const y = Number(spaceY);
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Invalid space row (${x}) or col (${y})`);
    }

    log.debug("Parsed arguments!");

    const ixs = await changeOfferInstruction(walletKeyPair, base_address, {
      mint: mint_address,
      x,
      y,
      price: 1_000_000_000,
      create: true,
    });

    log.debug("Instructions complete");
    await sendTransactionWithRetryWithKeypair(
      solConnection,
      walletKeyPair,
      ixs,
      [walletKeyPair]
    );
  });

programCommand("change-color")
  .option("-x, --space-x <number>", `Space x`, undefined)
  .option("-y, --space-y <number>", `Space y`, undefined)
  .option("-f, --frame <number>", `Frame`, undefined)
  .option("-b, --base <string>", `Base`, undefined)
  .option("-m, --mint <string>", `Mint of NFT`, undefined)
  .action(async (directory, cmd) => {
    const { keypair, env, cacheName, spaceX, spaceY, frame, base, mint } =
      cmd.opts();

    const base_address = base ? new PublicKey(base) : BASE;
    const mint_address = new PublicKey(mint);
    const walletKeyPair = loadWalletKey(keypair);

    const solConnection = new anchor.web3.Connection(clusterApiUrl(env));
    const x = Number(spaceX);
    const y = Number(spaceY);
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Invalid space row (${x}) or col (${y})`);
    }

    log.debug("Parsed arguments!");

    const ixs = await changeColorInstruction(
      solConnection,
      walletKeyPair,
      base_address,
      { x, y, frame: 0, r: 0, g: 0, b: 0, spaceMint: mint_address }
    );

    log.debug("Instructions complete");
    await sendTransactionWithRetryWithKeypair(
      solConnection,
      walletKeyPair,
      ixs,
      [walletKeyPair]
    );
  });

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      "-k, --keypair <path>",
      `Solana wallet location`,
      "--keypair not provided"
    )
    .option(
      "-e, --env <string>",
      "Solana cluster env name",
      "devnet" //mainnet-beta, testnet, devnet
    )
    .option("-c, --cache-name <string>", "Cache file name", "test")
    .option("-l, --log-level <string>", "log level", setLogLevel);
}

function setLogLevel(value) {
  if (value === undefined || value === null) {
    return;
  }
  log.info("setting the log value to: " + value);
  log.setLevel(value);
}

program.parse(process.argv);
