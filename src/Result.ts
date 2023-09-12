import { type IResult } from "./IResult";
import { None, Some, constNone, constSome } from "./Option";

/**
 * A type that can contain a succes value of type `T` or an error value of type
 * `E`.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Subtype of `Result<T, E>` that contains a success value of type `T`.
 */
export type Ok<T, E> = OkImpl<T, E>;

/**
 * Subtype of `Result<T, E>` that contains an error value of type `E`.
 */
export type Err<T, E> = ErrImpl<T, E>;

/**
 * Returns an instance of `Ok` whose value is `value`.  The return value uses
 * `Result` rather than `Ok` to avoid constraining the type of variables
 * initialize by a call to this function.
 *
 * @see {@link constOk}
 */
export function Ok<E, T>(value: T): Result<T, E> {
  return new OkImpl(value);
}

/**
 * Returns an instance of `Err` whose value is `error`.  The return value uses
 * `Result` rather than `Err` to avoid constraining the type of variables
 * initialize by a call to this function.
 *
 * @see {@link constErr}
 */
export function Err<T, E>(error: E): Result<T, E> {
  return new ErrImpl(error);
}

/**
 * Same as {@link Ok}, but returns a more specific type.
 */
export function constOk<E, T>(value: T): Ok<T, E> {
  return new OkImpl(value);
}

/**
 * Same as {@link Err}, but returns a more specific type.
 */
export function constErr<T, E>(error: E): Err<T, E> {
  return new ErrImpl(error);
}

/**
 * Tests wether an unknown value is an instance of `Result`.
 */
export function isResult(arg: unknown): arg is Result<unknown, unknown> {
  return arg instanceof OkImpl || arg instanceof ErrImpl;
}

export const Result = {
  /**
   * Returns `Ok(x)` if `f()` returns `x`, or `Err(x)` of `f()` throws `x`.
   */
  try<T>(f: () => T): Result<T, unknown> {
    try {
      return Ok(f());
    } catch (error) {
      return Err(error);
    }
  },

  /**
   * Converts a promise that resolves to `x` into a promise that resolves to
   * `Ok(x)`, and converts a promise that rejects with `x` to a promise that
   * resolves to `Err(x)`.
   */
  fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>> {
    return promise.then(
      (value) => Ok(value),
      (error) => Err(error),
    );
  },
};

class OkImpl<T, E> implements IResult<T, E> {
  constructor(
    /**
     * The value contained in this object.
     */
    readonly value: T,
  ) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isOkAnd(p: (value: T) => unknown): this is Ok<T, E> {
    return Boolean(p(this.value));
  }

  isErr(): false {
    return false;
  }

  isErrAnd(p: (error: E) => unknown): false {
    return false;
  }

  expect(message: string | (() => unknown)): T {
    return this.value;
  }

  unwrap(errorFactory?: () => unknown): T {
    return this.value;
  }

  unwrapOr<D>(defaultValue: D): T | D {
    return this.value;
  }

  unwrapOrElse<R>(d: (error: E) => R): T {
    return this.value;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    throw errorFactory ? errorFactory() : Error("Missing error value");
  }

  ok(): Some<T> {
    return constSome(this.value);
  }

  err(): None<E> {
    return constNone();
  }

  map<R>(f: (value: T) => R): Ok<R, E> {
    return new OkImpl(f(this.value));
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapErr<R>(f: (error: E) => R): Result<T, R> {
    return this as unknown as Ok<T, R>;
  }

  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return onOk(this.value);
  }

  and<T2, E2>(other: Result<T2, E2>): Result<T2, E2> {
    return other;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Result<R, RE> {
    return f(this.value);
  }

  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Result<R, RE> {
    return this.andThen(f);
  }

  or<T2, E2>(other: Result<T2, E2>): Ok<T, E> {
    return this;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Ok<T, E> {
    return this;
  }

  toPromise(): Promise<T> {
    return Promise.resolve(this.value);
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }

  toString(): string {
    return `Ok(${this.value})`;
  }
}

class ErrImpl<T, E> implements IResult<T, E> {
  constructor(
    /**
     * The error value contained in this object.
     */
    readonly error: E,
  ) {}

  isOk(): false {
    return false;
  }

  isOkAnd(p: (value: T) => unknown): false {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  isErrAnd(p: (error: E) => unknown): this is Err<T, E> {
    return Boolean(p(this.error));
  }

  expect(message: string | (() => unknown)): never {
    throw typeof message === "string" ? message : message();
  }

  unwrap(errorFactory?: () => unknown): never {
    throw errorFactory ? errorFactory() : this.error;
  }

  unwrapOr<D>(defaultValue: D): D {
    return defaultValue;
  }

  unwrapOrElse<R>(d: (error: E) => R): R {
    return d(this.error);
  }

  unwrapErr(errorFactory?: () => unknown): E {
    return this.error;
  }

  ok(): None<T> {
    return constNone();
  }

  err(): Some<E> {
    return constSome(this.error);
  }

  map<R>(f: (value: T) => R): Err<R, E> {
    return this as unknown as Err<R, E>;
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D {
    return defaultValue;
  }

  mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): D {
    return d(this.error);
  }

  mapErr<R>(f: (error: E) => R): Err<T, R> {
    return new ErrImpl(f(this.error));
  }

  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return onErr(this.error);
  }

  and<T2, E2>(other: Result<T2, E2>): Err<T, E> {
    return this;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> {
    return this;
  }

  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> {
    return this.andThen(f);
  }

  or<T2, E2>(other: Result<T2, E2>): Result<T2, E2> {
    return other;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Result<R, RE> {
    return d(this.error);
  }

  toPromise(): Promise<T> {
    return Promise.reject(this.error);
  }

  [Symbol.iterator](): Iterator<T> {
    return [].values();
  }

  toString(): string {
    return `Err(${this.error})`;
  }
}
