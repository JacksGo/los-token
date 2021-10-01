import * as blake2 from 'blake2';
import ms from 'ms';
import { randomBytes } from 'crypto';
import { ExpirationError, SignatureError, ValidationError } from './errors';

type SupportedAlgorithm = Exclude<blake2.Blake2Algorithm, 'bypass'>;
type Id = string | number | bigint;

export enum BigIntMode {
  Never,
  Always
}

interface ConstructorOptions {
  defaultTTL: number | string,
  algorithm: SupportedAlgorithm,
  useBigInt: BigIntMode,
}

interface ValidateOptions {
  ignoreExpiration: boolean,
}

interface ValidationReturn {
  id: Id,
  expires: number | bigint,
}

const bigIntToNumberSafe = (n: bigint): number | bigint => {
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('This token\'s data cannot be safely expressed using the Number type.');
  } else {
    return parseInt(n.toString(), 10);
  }
};

export class Los {
  private readonly key: Buffer;
  private readonly salt: string;
  public readonly useBigInt: BigIntMode = BigIntMode.Never;
  public readonly algorithm: SupportedAlgorithm = 'blake2bp';
  public defaultTTL = 3600;

  private readonly hash: blake2.KeyedHash;

  public constructor(key: string, salt: string = randomBytes(32).toString('hex'), options?: Partial<ConstructorOptions>) {
    this.key = Buffer.from(key);
    this.salt = salt;

    switch (typeof options?.defaultTTL) {
      case 'string':
        this.defaultTTL = Math.floor(ms(options.defaultTTL) / 1000);
        break;
      case 'number':
        this.defaultTTL = options.defaultTTL;
        break;
      default:
        break;
    }

    if (options?.algorithm !== undefined) this.algorithm = options.algorithm;
    if (options?.useBigInt !== undefined) this.useBigInt = options.useBigInt;

    this.hash = blake2.createKeyedHash(this.algorithm, this.key, { digestLength: 32 });
  }

  sign(id: Id, expires: number | bigint = Math.floor(Date.now() / 1000) + this.defaultTTL): string {
    if (id === undefined) throw new SyntaxError('ID must be provided.');
    if (expires < 0) throw new RangeError('Expiration must be a positive integer.');

    const exp = typeof expires === 'number'
      ? Math.floor(expires)
      : expires;

    const payload: Buffer = Buffer.from(`${id}.${exp}.${this.salt}`);

    const hash: blake2.KeyedHash = this.hash.copy();
    hash.update(payload);
    const signature = hash.digest('hex');

    // We can save bytes for numeric IDs by converting to base-16 instead of using strings.
    // We'll need to use a flag when signing to denote whether or not the ID is numeric.

    const idIsNumeric = (typeof id === 'number' || typeof id === 'bigint');

    const idHex = idIsNumeric
      ? id.toString(16)
      : Buffer.from(String(id)).toString('hex');

    const numericModeFlag = Number(idIsNumeric).toString(); // 1 if numeric, 0 if string.

    return `${numericModeFlag}${idHex}.${exp.toString(16)}.${signature}`;
  }

  validate(token: string, options?: Partial<ValidateOptions>): ValidationReturn {
    const segments: string[] = token.split('.');

    if (segments.length !== 3) throw new ValidationError();

    const idIsNumeric = segments[0][0] === '1';

    const id = idIsNumeric
      ? BigInt(`0x${segments[0].slice(1)}`)
      : Buffer.from(segments[0].slice(1), 'hex').toString();

    const expires = parseInt(segments[1], 16);

    const reconstructedData = [id, expires, this.salt];
    const reconstructedPayload: Buffer = Buffer.from(reconstructedData.join('.'));

    const hash : blake2.KeyedHash = this.hash.copy();
    hash.update(reconstructedPayload);
    const computedSignature = hash.digest('hex');

    if (computedSignature !== segments[2]) throw new SignatureError();

    if (Number.isNaN(expires)) throw new ValidationError();

    if (expires * 1000 <= Date.now() && options?.ignoreExpiration !== true) {
      throw new ExpirationError();
    }

    let coercedId: Id = id;

    if (typeof id !== 'string' && this.useBigInt === BigIntMode.Never) {
      coercedId = bigIntToNumberSafe(id);
    }

    const coercedExpiration = this.useBigInt === BigIntMode.Always
      ? BigInt(expires)
      : expires;

    return {
      id: coercedId,
      expires: coercedExpiration,
    };
  }
}

export default Los;
