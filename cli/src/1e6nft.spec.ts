let path = require("path");
let exec = require("child_process").exec;
import fs from "fs";
import {Keypair} from "@solana/web3.js";

// CHANGE THIS
const PRIVATE_KEY_FILE =
  //"~/.config/solana/8U2KXijbXKo12FmpNhEAXdavYUaUwFBZJ24kiZt7xxKF.json";
  //"~/.config/solana/3Ms8aHwYsxem6CfxhnUAdPHPm69UENFB8dnMTDi4hsFp.json";
  "~/Downloads/god28nErvbeaxjc4e5v8CYDHXjC1SoA1QdHG7dtTRcK.json";

const AUTH =
  "~/Downloads/yesKxLdEePuyMrE7PVsgWRnYum1vwAgV3q7vagxb9ob.json";
//

// for accept offer
// const BUYER =
//   "~/Documents/EXxVWXEA4sX9aVcaCrbvTDLnoyLASkJ2KLGU8UKbwP3o.json";
// const OWNER = "ALTTa31U6zLtL7FJZXooYYan3PVcZtUmtfsM9i2Qfw4n";

function loadWalletKey(keypair): Keypair {
  if (!keypair || keypair == "") {
    throw new Error("Keypair is required!");
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString()))
  );
  return loaded;
}

let base;
let base_pk;

const generate_new_base = true;
if (generate_new_base) {
  base = Keypair.generate();
  fs.writeFileSync(`./temp_test/base.json`, `[${base.secretKey.toString()}]`);
  base_pk = base.publicKey.toBase58();
}
base = loadWalletKey("./temp_test/base.json"); // "12CJwh7HJEh91q4e87SciZuypNd87z3x2atcQGP61R8q.json");
base_pk = base.publicKey.toBase58();

console.log("Base: ", base_pk);

// let cacheset = "megalaunchNew";

// let check_key = loadWalletKey(PRIVATE_KEY_FILE);
// let check_pk = check_key.publicKey.toBase58();
// console.log(check_pk);

// const base_pk = "12CJwh7HJEh91q4e87SciZuypNd87z3x2atcQGP61R8q";


// console.log(base_pk);

// TESTS

test("Test init base", async () => {
  let result = await cli(
    `initialize-base -k ${PRIVATE_KEY_FILE} -c ${cacheset} -l trace -b ${base.secretKey}`,
    "."
  );
  try {
    console.log(result.stdout);
    expect(result.code).toBe(0);
  } catch (err) {
    err.message = result.stderr;
    throw err;
  }
}, 30000000);

// // for (let nx = 0; nx < 5; ++nx){
// //   for(let ny = 0; ny < 5; ++ny){
let nx = 0;
let ny = 0;
// test("Test buying new neighborhood", async () => {
//   let result = await cli(
//     `register_candy_machine -k ${PRIVATE_KEY_FILE} -c ${cacheset} -nx ${nx} -ny ${ny} -l trace -b ${base_pk}`,
//     "."
//   );
//   try {
//     expect(result.code).toBe(0);
//     console.log(result.stdout);
//   } catch (err) {
//     err.message = result.stderr;
//     throw err;
//   }
// }, 30000000);

// for (let jj = 0; jj < 3; jj++) {
//   test("Test create cluster", async () => {
//     let result = await cli(
//       `initialize-cluster -k ${PRIVATE_KEY_FILE} -c ${cacheset} -nx ${nx} -ny ${ny} -l trace -b ${base_pk} -f 0`,
//       "."
//     );
//     try {
//       expect(result.code).toBe(0);
//       console.log(result.stdout);
//     } catch (err) {
//       err.message = result.stderr;
//       throw err;
//     }
//   }, 30000000);
// }


// test("Test mint", async () => {
//   let promises = [];
//   for (let i = 0; i < 50; i++) {
//     promises.push(
//       cli(
//         `test-mint -k ${PRIVATE_KEY_FILE} -r ${AUTH} -c ${cacheset} -nx 0 -ny 0 -l trace -b ${base_pk}`,
//         "."
//       )
//     );
//   }
//   let result = await Promise.all(promises);

//   console.log(result)
//   try {
//     console.log(result.stdout);
//     expect(result.code).toBe(0);
//     console.log(result.stdout);
//   } catch (err) {
//     err.message = result.stderr;
//     throw err;
//   }
// }, 6000000);

// const mint_object = JSON.parse(
//   fs.readFileSync("./temp_test/mint.json").toString()
// );
// const MINT = mint_object["b58"];
// const space_x = mint_object["spaceX"];
// const space_y = mint_object["spaceY"];

// test("Test initialize space", async () => {
//   let result = await cli(
//     `test-initialize-space -k ${PRIVATE_KEY_FILE} -m ${MINT} -c ${cacheset} -px ${space_x} -py ${space_y} -l trace -b ${base_pk}`,
//     "."
//   );

//   try {
//     console.log(result.stdout);
//     expect(result.code).toBe(0);
//     console.log(result.stdout);
//   } catch (err) {
//     err.message = result.stderr;
//     throw err;
//   }
// }, 30000);

// test("Test change color", async () => {
//   let result = await cli(
//     `test-change-color -k ${PRIVATE_KEY_FILE} -m ${MINT} -c ${cacheset} -px ${space_x} -py ${space_y} -r 255 -g 255 -b 0 -f 0 -l trace -b ${base_pk}`,
//     "."
//   );

//   try {
//     console.log(result.stdout);
//     expect(result.code).toBe(0);
//     console.log(result.stdout);
//   } catch (err) {
//     err.message = result.stderr;
//     throw err;
//   }
// }, 3000000);


// TO DO CHANGE OFFER

// test("Test accept offer", async () => {
//   let result = await cli(
//     `test-accept-offer -k ${BUYER} -m ${MINT} -c ${cacheset} -px 0 -py 28 -o ${OWNER} -l trace -b ${base_pk}`,
//     "."
//   );

//   try {
//     console.log(result.stdout);
//     expect(result.code).toBe(0);
//     console.log(result.stdout);
//   } catch (err) {
//     err.message = result.stderr;
//     throw err;
//   }
// }, 30000);

function cli(args, cwd) {
  return new Promise((resolve) => {
    const command = `NODE_OPTIONS='--unhandled-rejections=strict' ts-node ${path.resolve(
      "./src/1e6nft-cli.ts"
    )} ${args}`;
    exec(command, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr,
      });
    });
  });
}
