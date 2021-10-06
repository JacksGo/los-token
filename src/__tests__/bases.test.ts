import {
  decToB89,
  b89ToDec,
  strToB89,
  b89ToStr,
  bufToB89,
  b89ToBuf,
} from '../bases';

describe('Decimal values are properly encoded', () => {
  const initial = 123456789;
  const encoded = decToB89(initial);
  const decoded = b89ToDec(encoded);
  test('encodes to the expected value', () => {
    expect(encoded).toBe('B|LA_');
  });
  test('decodes back to the initial value', () => {
    const castDecoded = Number(decoded);
    expect(castDecoded).toBe(initial);
  });
});

describe('BigInt values are properly encoded', () => {
  const initial = 1234567891011121314n;
  const encoded = decToB89(initial);
  const decoded = b89ToDec(encoded);
  test('encodes to the expected value', () => {
    expect(encoded).toBe('Du22v03RKY');
  });
  it('decodes back to the initial value', () => {
    expect(decoded).toBe(initial);
  });
});

describe('String values are properly encoded', () => {
  const initial = 'LosToken: Fun for the whole family! 👨‍👩‍👧‍👦';
  const encoded = strToB89(initial);
  const decoded = b89ToStr(encoded);
  test('encodes to the expected value', () => {
    expect(encoded).toBe('Br9U*H[7Q^X~ivKUArNS2yV=c!Dz*\'>4N#T1ML|irX^+fl4TR2MwzC8!gLi3?`H(Rcv`{e#3j7~/');
  });
  test('decodes back to the initial value', () => {
    expect(decoded).toBe(initial);
  });
});

describe('Buffer values are properly encoded', () => {
  const initial = 'I dunno; I\'m just, like, tossin\' strings into the function, bro.';
  const inputBuffer = Buffer.from(initial);
  const encoded = bufToB89(inputBuffer);
  const decoded = b89ToBuf(encoded);
  test('encodes to the expected value', () => {
    expect(encoded).toBe('h`HN~BbW7<zu?oq?U/A-vS@O2V--Sy-vwqF7#]:O3`O<#dbbCZ-7!bsauo@b%<`t$5&Hf$]Z8`AhU3(');
  });
  test('decodes back to the initial value', () => {
    expect(decoded.toString('hex')).toBe(inputBuffer.toString('hex'));
  });
});
