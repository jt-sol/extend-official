import {PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import {BinaryReader, BinaryWriter} from 'borsh';
import base58 from 'bs58';
import {StringPublicKey} from './ids';

export const extendBorsh = () => {
  (BinaryReader.prototype as any).readPubkey = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };

  (BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(value.toBuffer());
  };

  (BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return base58.encode(array) as StringPublicKey;
  };

  (BinaryWriter.prototype as any).writePubkeyAsString = function (
    value: StringPublicKey,
  ) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(base58.decode(value));
  };
};

extendBorsh();

export const twoscomplement_u2i = function(arr) {
  let sign = 1;
  if (arr.slice(7)[0] > 127) {
    arr = arr.map(value => 255 - value);
    arr[0] += 1;
    sign = -1;
  }
  let counter = 7;
  while(arr[counter] === 0) {
    counter -= 1;
  }
  let num = 0;
  for (let i = 0; i < counter + 1; i++) {
    num += arr[i] * Math.pow(2, 8*i);
  }
  return sign * num;
  // return (new BN(arr).toNumber());
  // return new BN(arr).fromTwos(64).toNumber();
  
};

export const twoscomplement_i2u = function(long) {
  // if (long < 0) {
  //   const arr = new BN(long).toArray('le', 8).map(value => 255 - value);
  //   arr[0] += 1;
  //   return arr;
  // }
  // else {
  //   return new BN(long).toArray('le', 8);
  // }
  return new BN(long).toTwos(64).toArray('le', 8);
};

export const correct_negative_serialization = function(data, i_start, i_end, correct) {
  for (let i = 0; i < i_end-i_start; ++i) {
    data[i+i_start] = correct[i];
  }
  
  return data;
};
