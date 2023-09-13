import { None, Option, Some, constNone, constSome } from "./Option";

/**
 * A type that can contain a succes value of type `T` or an error value of type
 * `E`.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * The subtype of `Result<T,E>` that contains a value of type `T`.
 */
export type Ok<T, E> = OkImpl<T, E>;

/**
 * The subtype of `Result<T,E>` that contains a value of type `E`.
 */
export type Err<T, E> = ErrImpl<T, E>;

/**
 * Returns an instance of `Ok` whose value is `value`.  The return value uses
 * `Result` rather than `Ok` to avoid constraining the type of variables
 * initialized by a call to this function.
 *
 * @see {@link constOk}
 */
export function Ok<T, E>(value: T): Result<T, E> {
  return new OkImpl(value);
}

/**
 * Returns an instance of `Err` whose value is `error`.  The return value uses
 * `Result` rather than `Err` to avoid constraining the type of variables
 * initialized by a call to this function.
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

/**
 * Returns `Ok(nullable)` unless `value` is null or undefined; otherwise returns
 * `Err(error)`.
 */
export function fromNullableOr<T, E>(
  error: E,
  nullable: T,
): Result<NonNullable<T>, E> {
  return nullable == null ? Err(error) : Ok(nullable);
}

/**
 * Returns `Ok(nullable)` unless `nullable` is null or undefined; otherwise
 * returns `Err(f())`.
 */
export function fromNullableOrElse<T, E>(
  f: () => E,
  nullable: T,
): Result<NonNullable<T>, E> {
  return nullable == null ? Err(f()) : Ok(nullable);
}

/**
 * Converts a promise that resolves to `x` into a promise that resolves to
 * `Ok(x)`, and converts a promise that rejects with `e` to a promise that
 * resolves to `Err(e)`.
 */
export function fromPromise<T>(
  promise: Promise<T>,
): Promise<Result<T, unknown>> {
  return promise.then(
    (value) => Ok(value),
    (error) => Err(error),
  );
}

export const Result = {
  // @copy-comment
  /**
   * Returns an instance of `Ok` whose value is `value`.  The return value uses
   * `Result` rather than `Ok` to avoid constraining the type of variables
   * initialized by a call to this function.
   *
   * @see {@link constOk}
   */
  Ok,

  // @copy-comment
  /**
   * Returns an instance of `Err` whose value is `error`.  The return value uses
   * `Result` rather than `Err` to avoid constraining the type of variables
   * initialized by a call to this function.
   *
   * @see {@link constErr}
   */
  Err,

  // @copy-comment
  /**
   * Same as {@link Ok}, but returns a more specific type.
   */
  constOk,

  // @copy-comment
  /**
   * Same as {@link Err}, but returns a more specific type.
   */
  constErr,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Result`.
   */
  isResult,

  // @copy-comment
  /**
   * Converts a promise that resolves to `x` into a promise that resolves to
   * `Ok(x)`, and converts a promise that rejects with `e` to a promise that
   * resolves to `Err(e)`.
   */
  fromPromise,

  // @copy-comment
  fromNullableOr,

  // @copy-comment
  fromNullableOrElse,

  /**
   * Returns `Ok(x)` if `f()` returns `x`, or `Err(e)` if `f()` throws `x`.
   *
   * Its approximate inverse is {@link Result#unwrap}.
   */
  try<T>(f: () => T): Result<T, unknown> {
    try {
      return Ok(f());
    } catch (error) {
      return Err(error);
    }
  },
};

export namespace Result {
  // @copy-comment
  /**
   * The subtype of `Result<T,E>` that contains a value of type `T`.
   */
  export type Ok<T, E> = OkImpl<T, E>;

  // @copy-comment
  /**
   * The subtype of `Result<T,E>` that contains a value of type `E`.
   */
  export type Err<T, E> = ErrImpl<T, E>;
}

interface Matcher<T, E, R> {
  Ok(value: T): R;
  Err(error: E): R;
}

/**
 * The interface implemented by {@link Result}.
 */
interface IResult<T, E> extends Iterable<T> {
  /**
   * Tests whether `this` is `Ok(_)`.
   */
  isOk(): this is Ok<T, E>;

  /**
   * Tests whether `this` is an `Ok(x)` for which `p(x)` is a truthy value.
   */
  isOkAnd(p: (value: T) => unknown): boolean;

  /**
   * Tests whether `this` does not contain a value.
   */
  isErr(): this is Err<T, E>;

  /**
   * Tests whether `this` is an `Err(e)` for which `p(e)` is a truthy value.
   */
  isErrAnd(p: (error: E) => unknown): boolean;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  expect(message: string | (() => string)): T;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise throws `Error(message)`
   * or `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  expectErr(message: string | (() => string)): E;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown; otherise throws `e` where `this` is `Err(e)`.
   */
  unwrap(errorFactory?: () => unknown): T;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `defaultValue`.
   */
  unwrapOr<D>(defaultValue?: D): D | T | undefined;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `f()`.
   */
  unwrapOrElse<R>(d: (error: E) => R): T | R;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `undefined as T`.
   */
  unwrapUnchecked(): T;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `undefined`.
   *
   * Equivalent to `this.unwrapOr(undefined)`.
   *
   * @see {@link mapOrUndef}
   */
  unwrapOrUndef(): T | undefined;

  /**
   * Alias of {@link unwrapOrUndef}.
   */
  toNullable(): T | undefined;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise throws an error. If
   * `ErrorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrapErr(errorFactory?: () => unknown): E;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise returns `undefined as E`.
   */
  unwrapErrUnchecked(): E;

  /**
   * If `this` is `Ok(x)`, returns `Some(x)`, otherwise returns `None()`.
   */
  ok(): Option<T>;

  /**
   * If `this` is `Err(e)`, returns `Some(e)`, otherwise returns `None()`.
   */
  err(): Option<E>;

  /**
   * If `this` is `Ok(x)`, returns `Ok(f(x))`, otherwise returns `this`.
   */
  map<R>(f: (value: T) => R): Result<R, E>;

  /**
   * If `this` is `Ok(x)`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Ok(x)`, returns `f(x)`, otherwise returns
   * `d()`.
   */
  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Ok(x)`, returns `f(x)`, otherwise returns
   * `undefined`.
   *
   * Equivalent to `this.map(f).toNullable()`.
   */
  mapOrUndef<R>(f: (value: T) => R): R | undefined;

  /**
   * If `this` is `Ok(x)`, returns `fromNullableOr(f(x))`, otherwise returns
   * `Err(error)`.
   */
  mapNullableOr<D, R>(defaultError: D, f: (value: T) => R | undefined | null): Result<NonNullable<R>, D | E>;

  /**
   * If `this` is `Ok(x)`, returns `fromNullableOrElse(d, f(x))`, otherwise returns
   * `Err(error)`.
  */
  mapNullableOrElse<D, R>(d: () => D, f: (value: T) => R | undefined | null): Result<NonNullable<R>, D | E>;

  /**
   * If `this` is `Err(e)`, returns `Err(f(e))`, otherwise returns
   * `this`.
   */
  mapErr<R>(f: (error: E) => R): Result<T, R>;

  /**
   * Calls `f(x)` for its side effects if `this` is `Ok(x)`.
   *
   * Equivalent to `this.mapOrElse(() => {}, f)`.
   *
   * @see {@link matchErr}, {@link mapOrElse}
   */
  matchOk(f: (value: T) => void): void;

  /**
   * Calls `f(e)` for its side effects if `this` is `Err(e)`.
   *
   * Equivalent to `this.mapOrElse(f, () => {})`.
   *
   * @see {@link matchOk}, {@link mapOrElse}
   */
  matchErr(f: (error: E) => void): void;

  /**
   * If `this` is `Ok(_)`, returns `other`, otherwise returns
   * `this`.
   */
  and<T2, E2>(other: Result<T2, E2>): Err<T, E> | Result<T2, E2>;

  /**
   * If `this` is `Ok(x)`, returns `f(x)`, otherwise returns
   * `this`.
   */
  andThen<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> | Result<R, RE>;

  /**
   * An alias of `andThen`.
   */
  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> | Result<R, RE>;

  /**
   * If `this` is `Ok(_)`, returns `this`, otherwise returns
   * `other`.
   */
  or<T2, E2>(other: Result<T2, E2>): Ok<T, E> | Result<T2, E2>;

  /**
   * If `this` is `Ok(_)`, returns `this`, otherwise returns
   * `d(x)` where `x` is the error value of `this`.
   */
  orElse<R, RE>(d: (error: E) => Result<R, RE>): Ok<T, E> | Result<R, RE>;

  /**
   * Performs the following translation:
   *
   * `Ok(None())` ↦ `None()`
   *
   * `Ok(Some(x))` ↦ `Some(Ok(x))`
   *
   * `Err(e)` ↦ `Some(Err(e))`
   *
   */
  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>>;

  /**
   * If `this` is `Ok(x)`, returns a promise that resolves to `x`; if `this` is
   * `Err(e)`, returns a promise that rejects with `e`.
   */
  toPromise(): Promise<T>;
}

/**
 * The implemention of the {@link Ok} type.
 */
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

  isOkAnd(p: (value: T) => unknown): boolean {
    return Boolean(p(this.value));
  }

  isErr(): false {
    return false;
  }

  isErrAnd(p: (error: E) => unknown): false {
    return false;
  }

  expect(message: string | (() => string)): T {
    return this.value;
  }

  expectErr(message: string | (() => string)): never {
    throw Error(typeof message === "string" ? message : message());
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

  unwrapOrUndef(): T {
    return this.value;
  }

  toNullable(): T {
    return this.value;
  }

  unwrapUnchecked(): T {
    return this.value;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    throw errorFactory ? errorFactory() : Error("Missing error value");
  }

  unwrapErrUnchecked(): E {
    return undefined as E;
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

  mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrUndef<R>(f: (value: T) => R): R {
    return f(this.value);
  }

  mapNullableOr<D, R>(defaultError: D, f: (value: T) => R | undefined | null): Result<NonNullable<R>, D|E> {
    return fromNullableOr(defaultError, f(this.value));
  }

  mapNullableOrElse<D, R>(d: () => D, f: (value: T) => R | undefined | null): Result<NonNullable<R>, D | E> {
    return fromNullableOrElse(d, f(this.value));
  }

  mapErr<R>(f: (error: E) => R): Result<T, R> {
    return this as unknown as Ok<T, R>;
  }

  matchOk(f: (value: T) => void): void {
    f(this.value);
  }

  matchErr(f: (error: E) => void): void {}

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

  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>> {
    return this.unwrapUnchecked().mapOrElse(
      () => None(),
      (value) => Some(Ok(value)),
    );
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

/**
 * The implementation of the {@link Err} type.
 */
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

  isErrAnd(p: (error: E) => unknown): boolean {
    return Boolean(p(this.error));
  }

  expect(message: string | (() => string)): never {
    throw Error(typeof message === "string" ? message : message());
  }

  expectErr(message: string | (() => string)): E {
    return this.error;
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

  unwrapUnchecked(): T {
    return undefined as T;
  }

  unwrapOrUndef(): undefined {
    return undefined;
  }

  toNullable(): undefined {
    return undefined;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    return this.error;
  }

  unwrapErrUnchecked(): E {
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

  mapOrUndef<R>(f: (value: T) => R): undefined {
    return undefined;
  }

  mapNullableOr<D, R>(defaultError: D, f: (value: T) => R | undefined | null): Err<NonNullable<R>, D | E> {
    return this as Err<NonNullable<R>, D | E>;
  }

  mapNullableOrElse<D, R>(d: () => D, f: (value: T) => R | undefined | null): Err<NonNullable<R>, D | E> {
    return this as Err<NonNullable<R>, D | E>;
  }

  mapErr<R>(f: (error: E) => R): Err<T, R> {
    return new ErrImpl(f(this.error));
  }

  matchOk(f: (value: T) => void): void {}

  matchErr(f: (error: E) => void): void {
    f(this.error);
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

  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>> {
    return Some(Err(this.unwrapErrUnchecked()));
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
