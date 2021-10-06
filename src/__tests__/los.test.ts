import {
  Los,
  ValidationError,
  SignatureError,
  ExpirationError,
  BigIntMode,
} from '../index';

const key = 'gKXe634fb4YeMFgXngWIf6OmZkxsyw2v';
const salt = 'CchXL7iCL6yUw0U8tnateu2YvSK3PUE0';

const tokenGenerator = new Los(key, salt);

const tokenGeneratorBigInt = new Los(key, salt, {
  useBigInt: BigIntMode.Always,
});

const tokenGeneratorDifferentKey = new Los(`${key.slice(0, -1)}0`, salt);
const tokenGeneratorDifferentSalt = new Los(key, `${salt.slice(0, -1)}v`);

// Each of the sets in the patterns below is identical and reflects the legal characters in an
// RFC6265 cookie-octet.
const tokenPatternString = /0([\w!#-+\-/:<-@[\]^`{-~]+\.){2}[\w!#-+\-/:<-@[\]^`{-~]+/gi;
const tokenPatternNumeric = /1([\w!#-+\-/:<-@[\]^`{-~]+\.){2}[\w!#-+\-/:<-@[\]^`{-~]+/gi;

describe('Sign correctly handles timestamp variations', () => {
  test('Sign succeeds with default timestamp', () => {
    expect(tokenGenerator.sign('LosToken')).toMatch(tokenPatternString);
  });

  test('Sign fails with negative timestamp', () => {
    expect(() => tokenGenerator.sign('LosToken', -1)).toThrow(RangeError);
  });

  test('Sign succeeds with timestamp set in the past', () => {
    expect(tokenGenerator.sign('LosToken', Math.floor(Date.now() / 1000) - 3600)).toMatch(tokenPatternString);
  });
});

describe('Sign recognizes numeric ID', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const numberIdToken = tokenGenerator.sign(123456, exp);
  const stringIdToken = tokenGenerator.sign('123456', exp);

  test('Using numeric ID produces a valid token', () => {
    expect(numberIdToken).toMatch(tokenPatternNumeric);
  });

  test('Resulting token differs from stringified equivalent', () => {
    expect(numberIdToken).not.toEqual(stringIdToken);
  });
});

describe('Sign succeeds with BigInt ID', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const max = Number.MAX_SAFE_INTEGER;

  const numericToken = tokenGenerator.sign(max + 2, exp);
  const bigIntToken = tokenGenerator.sign(BigInt(max) + 2n, exp);
  const stringToken = tokenGenerator.sign((BigInt(max) + 2n).toString(), exp);

  test('Using BigInt ID produces a valid token', () => {
    expect(bigIntToken).toMatch(tokenPatternNumeric);
  });

  test('Resulting token differs from Number-based token when above MAX_SAFE_INTEGER', () => {
    expect(bigIntToken).not.toEqual(numericToken);
  });

  test('Resulting token differs from String-based token', () => {
    expect(bigIntToken).not.toEqual(stringToken);
  });
});

describe('Validate correctly handles timestamp variations', () => {
  const futureToken = tokenGenerator.sign('LosToken');
  const pastToken = tokenGenerator.sign('LosToken', Math.floor(Date.now() / 1000) - 3600);

  test('Validate succeeds with timestamp set in the future', () => {
    expect(tokenGenerator.validate(futureToken)).toMatchObject({ id: 'LosToken' });
  });

  test('Validate fails with timestamp set in the past', () => {
    expect(() => tokenGenerator.validate(pastToken)).toThrow(ExpirationError);
  });

  test('Validate succeeds when ignoring timestamp set in the past', () => {
    expect(tokenGenerator.validate(pastToken, { ignoreExpiration: true })).toMatchObject({ id: 'LosToken' });
  });
});

describe('Validate correctly handles leading type flag', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const max = Number.MAX_SAFE_INTEGER;

  const numericToken = tokenGenerator.sign(max - 5, exp);
  const bigIntToken = tokenGenerator.sign(BigInt(max) + 2n, exp);
  const stringToken = tokenGenerator.sign((BigInt(max) + 2n).toString(), exp);

  test('Validate produces a numeric id by default when given a number', () => {
    expect(tokenGenerator.validate(numericToken))
      .toEqual(expect.objectContaining({ id: expect.any(Number) }));
  });

  test('Validate produces a BigInt id when told to produce BigInts', () => {
    expect(tokenGeneratorBigInt.validate(numericToken))
      .toEqual(expect.objectContaining({ id: expect.any(BigInt) }));
  });

  test('Validate fails when decoding a BigInt-ranged id into a Number', () => {
    expect(() => tokenGenerator.validate(bigIntToken)).toThrow(RangeError);
  });

  test('Validate ignores BigInt flag when given a string', () => {
    expect(tokenGeneratorBigInt.validate(stringToken))
      .toEqual(expect.objectContaining({ id: expect.any(String) }));
  });
});

describe('Validate correctly handles invalid tokens', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const stringToken = tokenGenerator.sign('LosToken', exp);
  const splitToken = stringToken.split('.');

  test('Validate fails when token is empty', () => {
    expect(() => tokenGenerator.validate('')).toThrow(ValidationError);
  });

  test('Validate fails when token has too many segments', () => {
    expect(() => tokenGenerator.validate(`${stringToken}.LosToken`)).toThrow(ValidationError);
  });

  test('Validate fails when token is nonsense', () => {
    expect(() => tokenGenerator.validate('nonsense')).toThrow(ValidationError);
  });

  test('Validate fails when signature is changed', () => {
    const alteredSignatureToken = [splitToken[0], splitToken[1], splitToken[2].replace(/./gi, 'a')].join('.');
    expect(() => tokenGenerator.validate(alteredSignatureToken)).toThrow(SignatureError);
  });

  test('Validate fails when ID is changed', () => {
    const alteredIdToken = ['0DEADBEEF', splitToken[1], splitToken[2]].join('.');
    expect(() => tokenGenerator.validate(alteredIdToken)).toThrow(SignatureError);
  });

  test('Validate fails when expiration is changed', () => {
    const newExp = (Math.floor(Date.now() / 1000) + 7200).toString(16);
    const alteredExpirationToken = [splitToken[0], newExp, splitToken[2]].join('.');
    expect(() => tokenGenerator.validate(alteredExpirationToken)).toThrow(SignatureError);
  });

  test('Validate fails when key doesn\'t match', () => {
    expect(() => tokenGeneratorDifferentKey.validate(stringToken)).toThrow(SignatureError);
  });

  test('Validate fails when salt doesn\'t match', () => {
    expect(() => tokenGeneratorDifferentSalt.validate(stringToken)).toThrow(SignatureError);
  });
});
