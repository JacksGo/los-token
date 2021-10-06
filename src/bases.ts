/* eslint-disable no-bitwise */
import { TextEncoder, TextDecoder } from 'util';

// Create an encoding scheme that uses only cookie-safe characters as defined in RFC6265 https://datatracker.ietf.org/doc/html/rfc6265.
const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&'()*+-/:<=>?@[]^_`{|}~";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const decToB89 = (dec: number | bigint): string => {
  let b = BigInt(dec);
  let s = '';
  do {
    s = c[Number(b % 89n)] + s;
    b /= 89n;
  } while (b !== 0n);
  return s;
};

export const b89ToDec = (b89: string): bigint => {
  let m = 1n;
  let v = 0n;
  for (let i = b89.length; i > 0; i -= 1, m *= 89n) {
    v += BigInt(c.indexOf(b89[i - 1])) * m;
  }
  return v;
};

const bytesToB89 = (bytes: Uint8Array): string => {
  let b = 0n;
  for (let i = 0; i < bytes.length; i += 1) {
    b <<= 8n;
    b |= BigInt(bytes[i]);
  }
  return decToB89(b);
};

const b89ToBytes = (b89: string): Uint8Array => {
  let b = b89ToDec(b89);
  const bytes = [];
  while (b > 0n) {
    bytes.unshift(Number(b & 255n));
    b >>= 8n;
  }
  return Uint8Array.from(bytes);
};

export const strToB89 = (str: string): string => {
  const bytes = encoder.encode(str);
  return bytesToB89(bytes);
};

export const b89ToStr = (b89: string): string => {
  const bytes = b89ToBytes(b89);
  return decoder.decode(bytes);
};

export const bufToB89 = (buf: Buffer): string => {
  const bytes = new Uint8Array(buf);
  return bytesToB89(bytes);
};

export const b89ToBuf = (b89: string): Buffer => {
  const bytes = b89ToBytes(b89);
  return Buffer.from(bytes.buffer);
};
