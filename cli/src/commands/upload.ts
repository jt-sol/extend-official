import fs from "fs";
import { metadata } from "../helpers/metadata";

import { PublicKey, Keypair } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

import log from "loglevel";
import base58 from "bs58";
import {
  createConfig,
  getCandyMachineAddress,
  loadCandyProgram,
  loadWalletKey,
} from "../helpers/accounts";
import { loadCache, saveCache } from "../helpers/cache";

import { chunks } from "../helpers/various";
import {
  IMAGE_GENERATOR_URL,
  RPC_devnet,
  RPC_mainnet,
} from "../../../client/src/constants";
import { getConfigFileParsingDiagnostics } from "typescript";

function getLink(name: string) {
  const x = parseInt(name.split("(")[1].split(")")[0].split(",")[0]);
  const y = parseInt(name.split("(")[1].split(")")[0].split(",")[1]);
  return IMAGE_GENERATOR_URL + `metadata?x=${x}&y=${y}`;
}

async function initConfig(
  anchorProgram,
  walletKeyPair,
  {
    totalNFTs,
    mutable,
    symbol,
    retainAuthority,
    sellerFeeBasisPoints,
    creators,
    env,
    cache,
    cacheName,
    neighborhoodRow,
    neighborhoodCol,
  }
) {
  log.info("Initializing config");
  try {
    const res = await createConfig(anchorProgram, walletKeyPair, {
      maxNumberOfLines: new BN(totalNFTs),
      symbol,
      sellerFeeBasisPoints,
      isMutable: mutable,
      maxSupply: new BN(0),
      retainAuthority: retainAuthority,
      creators: creators.map((creator) => ({
        address: new PublicKey(creator.address),
        verified: true,
        share: creator.share,
      })),
    });
    cache.program.uuid = res.uuid;
    cache.program.config = res.config.toBase58();
    const config = res.config;

    const [candyMachine, bump] = await getCandyMachineAddress(
      res.config,
      cache.program.uuid
    );

    cache.candyMachineAddress = candyMachine.toBase58();

    log.info(
      `Initialized config for a candy machine with publickey: ${config.toBase58()}`
    );

    saveCache(neighborhoodRow, neighborhoodCol, cacheName, env, cache);
    return config;
  } catch (err) {
    log.error("Error deploying config to Solana network.", err);
    throw err;
  }
}

async function writeIndices({
  anchorProgram,
  cache,
  cacheName,
  env,
  config,
  walletKeyPair,
  neighborhoodRow,
  neighborhoodCol,
}) {
  const keys = Object.keys(cache.items);
  try {
    await Promise.all(
      chunks(Array.from(Array(keys.length).keys()), 100).map(
        async (allIndexesInSlice) => {
          for (
            let offset = 0;
            offset < allIndexesInSlice.length;
            offset += 10
          ) {
            const indexes = allIndexesInSlice.slice(offset, offset + 10);
            const onChain = indexes.filter((i) => {
              const index = keys[i];
              return cache.items[index]?.onChain || false;
            });
            const ind = keys[indexes[0]];

            if (onChain.length != indexes.length) {
              log.info(
                `Writing indices ${ind}-${keys[indexes[indexes.length - 1]]}`
              );
              try {
                await anchorProgram.rpc.addConfigLines(
                  ind,
                  indexes.map((i) => ({
                    uri: getLink(cache.items[keys[i]].name),
                    name: cache.items[keys[i]].name,
                  })),
                  {
                    accounts: {
                      config,
                      authority: walletKeyPair.publicKey,
                    },
                    signers: [walletKeyPair],
                  }
                );
                indexes.forEach((i) => {
                  cache.items[keys[i]] = {
                    ...cache.items[keys[i]],
                    onChain: true,
                  };
                });
                saveCache(
                  neighborhoodRow,
                  neighborhoodCol,
                  cacheName,
                  env,
                  cache
                );
              } catch (err) {
                log.error(
                  `Saving config line ${ind}-${
                    keys[indexes[indexes.length - 1]]
                  } failed`,
                  err
                );
              }
            }
          }
        }
      )
    );
  } catch (e) {
    log.error(e);
  } finally {
    saveCache(neighborhoodRow, neighborhoodCol, cacheName, env, cache);
  }
}

function updateCacheVercel(items, cache) {
  const snake_map = JSON.parse(
    fs.readFileSync("../minting_path/snake.json").toString()
  );

  items.map((toUpload) => {
    const globalRow = toUpload[0];
    const globalCol = toUpload[1];

    const localRow =
      globalRow >= 0 ? globalRow % 200 : ((globalRow + 1) % 200) + 199;
    const localCol =
      globalCol >= 0 ? globalCol % 200 : ((globalCol + 1) % 200) + 199;

    cache.items[snake_map[200 * localRow + localCol]] = {
      name: `Space (${globalRow},${globalCol})`,
      onChain: false,
    };
  });
}

type UploadParams = {
  items: any[];
  cacheName: string;
  env: string;
  keypair: string;
  retainAuthority: boolean;
  mutable: boolean;
  neighborhoodRow: number;
  neighborhoodCol: number;
};
export async function upload({
  items,
  cacheName,
  env,
  keypair,
  retainAuthority,
  mutable,
  neighborhoodRow,
  neighborhoodCol,
}: UploadParams): Promise<string> {
  const cache =
    loadCache(neighborhoodRow, neighborhoodCol, cacheName, env) || {};
  const cachedProgram = (cache.program = cache.program || {});
  cache.candyMachineAddress = cache.candyMachineAddress || {};
  const cachedItems = (cache.items = cache.items || {});

  if (Object.keys(cachedItems).length === 0) {
    console.log("initialize cache");
    updateCacheVercel(items, cache);
  }

  saveCache(neighborhoodRow, neighborhoodCol, cacheName, env, cache);

  const {
    seller_fee_basis_points: sellerFeeBasisPoints,
    symbol,
  } = metadata;

  const walletKeyPair = (keypair !== 'ledger') ? loadWalletKey(keypair) : Keypair.fromSecretKey(base58.decode(cache.hot_wallet));

  const creators = [
    { address: walletKeyPair.publicKey, share: 100 },
  ]

  const anchorProgram = await loadCandyProgram(
    walletKeyPair,
    env,
    env == "mainnet-beta" ? RPC_mainnet : RPC_devnet
  );

  const totalNFTs = Object.keys(cache.items).length;
  console.log(totalNFTs);
  const config = cachedProgram.config
    ? new PublicKey(cachedProgram.config)
    : await initConfig(anchorProgram, walletKeyPair, {
        totalNFTs,
        mutable,
        retainAuthority,
        sellerFeeBasisPoints,
        symbol,
        creators,
        env,
        cache,
        cacheName,
        neighborhoodRow,
        neighborhoodCol,
      });

  while (
    !Object.keys(cache.items)
      .map((key: string) => cache.items[key].onChain)
      .every(Boolean)
  ) {
    await writeIndices({
      anchorProgram,
      cache,
      cacheName,
      env,
      config,
      walletKeyPair,
      neighborhoodRow,
      neighborhoodCol,
    });
  }

  return config.toBase58();
}
