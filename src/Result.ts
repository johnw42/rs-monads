import { None, Option, Some, constNone, constSome } from "./Option";

/**
 * A type that can contain a succes value of type `T` or an error value of type
 * `E`.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export type Ok<T, E> = OkImpl<T, E>;
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

export const Result = {
  Ok,
  Err,
  constOk,
  constErr,
  isResult,

  /**
   * Returns `Ok(x)` if `f()` returns `x`, or `Err(x)` of `f()` throws `x`.
   *
   * Its approximate inverse is {@link Option#unwrap}.
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

export namespace Result {
  export type Ok<T, E> = OkImpl<T, E>;
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
  isOkAnd(p: (value: T) => unknown): this is Ok<T, E>;

  /**
   * Tests whether `this` does not contain a value.
   */
  isErr(): this is Err<T, E>;

  /**
   * Tests whether `this` is an `Err(x)` for which `p(x)` is a truthy value.
   */
  isErrAnd(p: (error: E) => unknown): this is Err<T, E>;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expect(message: string | (() => string)): T;

  /**
   * If `this` is `Err(x)`, returns `x`, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expectErr(message: string | (() => string)): E;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown; otherise throws `x` where `this` is `Err(x)`.
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
   * If `this` is `Err(x)`, returns `x`, otherwise throws an error. If
   * `ErrorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrapErr(errorFactory?: () => unknown): E;

  /**
   * If `this` is `Err(x)`, returns `x`, otherwise returns `undefined as E`.
   */
  unwrapErrUnchecked(): E;

  /**
   * If `this` is `Ok(x)`, returns `Some(x)`, otherwise returns `None()`.
   */
  ok(): Option<T>;

  /**
   * If `this` is `Err(x)`, returns `Some(x)`, otherwise returns `None()`.
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
   * If `this` is `Err(x)`, returns `Err(f(x))`, otherwise returns
   * `this`.
   */
  mapErr<R>(f: (error: E) => R): Result<T, R>;

  /**
   * If `this` is `Ok(x)`, calls `m.Ok(x)`.
   */
  match<R>(m: Pick<Matcher<T, E, R>, "Ok">): void;
  /**
   * If `this` is `Err(x)`, calls `m.Err(x)`.
   */
  match<R>(m: Pick<Matcher<T, E, R>, "Err">): void;
  /**
   * If `this` is `Ok(x)`, returns `m.Ok(x)`, otherwise returns `m.Err(x)`.
   */
  match<R>(m: Matcher<T, E, R>): R;

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
   * `Err(x)` ↦ `Some(Err(x))`
   *
   */
  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>>;

  /**
   * If `this` is `Ok(x)`, returns a promise that resolves to `x`; if `this` is
   * `Err(x)`, returns a promise that rejects with `x`.
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

  isOkAnd(p: (value: T) => unknown): this is Ok<T, E> {
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

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapErr<R>(f: (error: E) => R): Result<T, R> {
    return this as unknown as Ok<T, R>;
  }

  match<R>(m: Pick<Matcher<T, E, R>, "Ok">): void;
  match<R>(m: Pick<Matcher<T, E, R>, "Err">): void;
  match<R>(m: Matcher<T, E, R>): R;
  match<R>(m: Partial<Matcher<T, E,  R>>): void | R {
    if (m.Ok) {
      const r = m.Ok(this.value);
      return m.Err ? r : undefined;
    }
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

  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>> {
    return this.unwrapUnchecked().match({
      Some(value) {
        return Some(Ok<T,E>(value));
      },
      None() {
        return None<Result<T,E>>();
      },
    });
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

  isErrAnd(p: (error: E) => unknown): this is Err<T, E> {
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

  mapErr<R>(f: (error: E) => R): Err<T, R> {
    return new ErrImpl(f(this.error));
  }

  match<R>(m: Pick<Matcher<T, E, R>, "Ok">): void;
  match<R>(m: Pick<Matcher<T, E, R>, "Err">): void;
  match<R>(m: Matcher<T, E, R>): R;
  match<R>(m: Partial<Matcher<T, E, R>>): void | R {
    if (m.Err) {
      const r = m.Err(this.error);
      return m.Ok ? r : undefined;
    }
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
