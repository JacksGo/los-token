# los-token

Los, or `los-token`, is a small, deliberately feature-light identity token system. Its primary use case is for bare-bones session validation, particularly in applications where egress data comes at a premium and every byte sent over the wire counts. Los prioritizes compactness, sacrificing the advanced functionality and customizability of JWTs in favor of simple code, short runtimes, and small token sizes. Generated tokens contain only an ID field, an expiration field, and a hash, in that order, and take the form of period-delimited blocks encoded into a base-89, cookie-compliant character set (as defined by [RFC6265](https://datatracker.ietf.org/doc/html/rfc6265#page-9)). Los uses the [BLAKE2](https://www.blake2.net/) suite of cryptographic functions for hashing, and defaults to its 64-bit, multicore variant, BLAKE2bp.

# Usage

### Instantiation

```typescript
import { Los, BigIntMode } from 'los-token';
const tokenGenerator = new Los(key, [salt, options]);
```

- **`key`** - a string containing the private key that will be used for the hash.
- **`salt`** - a string containing a salt value that is incorporated into the hash. Defaults to a randomly generated 256-bit hex string.
- **`options`** - an object containing any of the following keys:
  - `defaultTTL` - the default lifetime, in seconds, of each token, expressed either as a number or as an [ms-formatted](https://www.npmjs.com/package/ms) string. Defaults to `3600`.
  - `algorithm` - one of `blake2b`, `blake2bp`, `blake2s`, or `blake2sp`. Defaults to `blake2bp`.
  - `useBigInt` - a boolean or a `BigIntMode` denoting whether decoded numeric IDs and expiration timestamps should be BigInts. Defaults to `false`.


### Generating a token

```typescript
const token: string = tokenGenerator.sign(id, [expires]);
```

- **`id`** - a string, number, or BigInt containing the user ID for which to generate a token. Note: in the latter two cases, Los expresses the numeric ID in hexadecimal directly, as opposed to using a stringified version. If you have string IDs but can guarantee that they will always be numeric, casting them to a numeric type is recommended to reduce wasted bytes.
- **`expires`** - a number or BigInt representing a UNIX timestamp in seconds at which the token will expire. If omitted, the token will last for `defaultTTL` seconds from the time of signing.


### Validating a token

```typescript
const result: { 
    id: string | number | bigint,
    expires: number | bigint
} = tokenGenerator.validate(token, [options]);
```

- **`token`** - a string containing a previously generated token.
- **`options`** - an object containing any of the following keys:
  - `ignoreExpiration` - a boolean denoting whether expiration errors should be ignored. If `true`, expired, but otherwise valid tokens will successfully validate. Defaults to `false`.


### Errors

When signing fails, it will do so with a native `Error` type such as `SyntaxError` or `RangeError`.
When validation fails, it will either use a native `Error` type or one of the following Los-specific error types:

- **`ValidationError`** - The token provided for validation is syntactically invalid and cannot be parsed.
- **`SignatureError`** - The hash calculated during validation doesn’t match the token’s included hash value.
- **`ExpirationError`** - The token’s `expires` value refers to a timestamp in the past.

To aid in determining whether an error is a Los-specific error, all Los-specific error types are extensions of a base type `LosError`, which is itself an extension of the native `Error` type.
