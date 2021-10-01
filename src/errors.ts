/* eslint-disable max-classes-per-file */

export class LosError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = Reflect.getPrototypeOf(this)?.constructor?.name ?? 'LosError';
  }
}

export class ValidationError extends LosError {
  constructor(message?: string) {
    super(message);
    this.message ||= 'The provided token is invalid.';
  }
}

export class SignatureError extends LosError {
  constructor(message?: string) {
    super(message);
    this.message ||= 'The provided token\'s signature doesn\'t match its contents.';
  }
}

export class ExpirationError extends LosError {
  constructor(message?: string) {
    super(message);
    this.message ||= 'The provided token is expired.';
  }
}
