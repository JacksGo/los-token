# los-token

Los, or `los-token`, is a small, deliberately feature-light identity token system. Its primary use case is for bare-bones session validation, particularly in cases where egress data comes at a premium and every byte sent over the wire counts. Los prioritizes compactness, sacrificing the advanced functionality and customizability of JWTs in favor of simple code, fast runtimes, and small token sizes. Generated tokens contain only a user id field, an expiration field, and a hash, in that order, and take the form of period-delimited hexadecimal blocks. Los uses the [BLAKE2](https://www.blake2.net/) suite of cryptographic functions for hashing, and defaults to its 64-bit, multicore variant, BLAKE2bp.

# Usage

### Instantiation

```typescript
const tokenGenerator = new Los(key, [salt, options]);
```

- **`key`** - a string containing the private key that will be used for the hash.
- **`salt`** - a string containing a salt value that is incorporated into the hash. Defaults to a randomly generated 256-bit hex string.
- **`options`** - an object containing any of the following keys:
  - `defaultTTL` - the default lifetime, in seconds, of each token, expressed either as a number or as an [ms-formatted](https://www.npmjs.com/package/ms) string. Defaults to `3600`.
  - `algorithm` - one of `blake2b`, `blake2bp`, `blake2s`, or `blake2sp`. Defaults to `blake2bp`.
  - `useBigInt` - a boolean or a `Los.BigIntMode` denoting whether decoded numeric IDs and expiration timestamps should be BigInts. Defaults to `false`.


### Generating a token

```typescript
const token: string = tokenGenerator.sign(id, [expires]);
```

- **`id`** - a string, number, or BigInt containing the user ID for which to generate a token. Note: in the latter two cases, Los expresses the numeric ID in hexadecimal directly, as opposed to using a stringified version. If you have string IDs but can guarantee that they will always be numeric, casting them to a numeric type is recommended to reduce wasted bytes.
- **`expires`** - a number or BigInt representing a UNIX timestamp in seconds at which the token will expire. If omitted, the token will last for `defaultTTL` seconds from the time the method is executed.


### Validating a token

```typescript
const result: {id: string | number | bigint, expires: number | bigint} = tokenGenerator.validate(token, [options]);
```

- **`token`** - a string containing a previously generated token.
- **`options`** - an object containing any of the following keys:
  - `ignoreExpiration` - a boolean denoting whether expiration errors should be ignored. If `true`, expired, but otherwise valid tokens will successfully validate. Defaults to `false`.
