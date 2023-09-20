import { None, Option, Some, constNone, constSome } from "./Option";
import { SingletonMonad } from "./common";

/**
 * A type that can contain a succes value of type `T` or an error value of type
 * `E`.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * The subtype of `Result<T,E>` that contains a value of type `E`.
 */
export type Err<T, E> = ErrImpl<T, E>;

/**
 * The subtype of `Result<T,E>` that contains a value of type `T`.
 */
export type Ok<T, E> = OkImpl<T, E>;

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
 * Collects a sequence of results into a single result containing the `Ok`
 * values. If any of the inputs is `Err(e)`, stopes immediately and returns
 * `Err(e)`.
 */
function collect<T, E>(results: Iterable<Result<T, E>>): Result<T[], E> {
  const items: T[] = [];
  for (const result of results) {
    if (result.isOk()) {
      items.push(result.value);
    } else {
      return result.withType<T[]>();
    }
  }
  return Ok(items);
}

/**
 * Same as {@link Err}, but returns a more specific type.
 */
export function constErr<T, E>(error: E): Err<T, E> {
  return new ErrImpl(error);
}

/**
 * Same as {@link Ok}, but returns a more specific type.
 */
export function constOk<T, E>(value: T): Ok<T, E> {
  return new OkImpl(value);
}

/**
 * Tests whether `a` and `b` are `Result` values which are equal according to
 * `a.equals(b, okCmp, errCmp)`.
 *
 * @see {@link ResultImpl#equals}
 */
function equals(
  a: unknown,
  b: unknown,
  okCmp?: (aValue: unknown, bValue: unknown) => boolean,
  errCmp?: (aError: unknown, bError: unknown) => boolean,
): boolean {
  return isResult(a) && isResult(b) && a.equals(b, okCmp, errCmp);
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

/**
 * Tests wether an unknown value is an instance of `Err`.
 */
export function isErr(arg: unknown): arg is Result<unknown, unknown> {
  return arg instanceof ErrImpl;
}

/**
 * Tests wether an unknown value is an instance of `Ok`.
 */
export function isOk(arg: unknown): arg is Result<unknown, unknown> {
  return arg instanceof OkImpl;
}

/**
 * Tests wether an unknown value is an instance of `Result`.
 */
export function isResult(arg: unknown): arg is Result<unknown, unknown> {
  return arg instanceof ResultBase;
}

/**
 * Returns `Ok(x)` if `f()` returns `x`, or `Err(e)` if `f()` throws `x`.
 *
 * Its inverse is {@link Result#unwrap}.
 */
function tryFrom<T>(f: () => T): Result<T, unknown> {
  try {
    return Ok(f());
  } catch (error) {
    return Err(error);
  }
}

export const Result = {
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
   * Returns an instance of `Ok` whose value is `value`.  The return value uses
   * `Result` rather than `Ok` to avoid constraining the type of variables
   * initialized by a call to this function.
   *
   * @see {@link constOk}
   */
  Ok,

  // @copy-comment
  /**
   * Same as {@link Err}, but returns a more specific type.
   */
  constErr,

  // @copy-comment
  /**
   * Same as {@link Ok}, but returns a more specific type.
   */
  constOk,

  // @copy-comment
  /**
   * Tests whether `a` and `b` are `Result` values which are equal according to
   * `a.equals(b, okCmp, errCmp)`.
   *
   * @see {@link ResultImpl#equals}
   */
  equals,

  // @copy-comment
  /**
   * Converts a promise that resolves to `x` into a promise that resolves to
   * `Ok(x)`, and converts a promise that rejects with `e` to a promise that
   * resolves to `Err(e)`.
   */
  fromPromise,

  // @copy-comment
  /**
   * Collects a sequence of results into a single result containing the `Ok`
   * values. If any of the inputs is `Err(e)`, stopes immediately and returns
   * `Err(e)`.
   */
  collect,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Err`.
   */
  isErr,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Ok`.
   */
  isOk,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Result`.
   */
  isResult,

  // @copy-comment
  /**
   * Returns `Ok(x)` if `f()` returns `x`, or `Err(e)` if `f()` throws `x`.
   *
   * Its inverse is {@link Result#unwrap}.
   */
  try: tryFrom,
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

/**
 * The interface implemented by {@link Result}.
 */
export abstract class ResultBase<T, E> extends SingletonMonad<T, Ok<T, E>> {
  /**
   * If `this` is `Ok(_)`, returns `other`, otherwise returns
   * `this`.
   */
  abstract and<T2, E2>(other: Result<T2, E2>): Result<T | T2, E|E2>;

  /**
   * If `this` is `Ok(x)`, returns `f(x)`, otherwise returns
   * `this`.
   */
  abstract andThen<R, RE>(f: (value: T) => Result<R, RE>): Result<R, E | RE>;

  /**
   * Tests if two `Result` values are equal, i.e. both `Err(x)` and `Err(y)`, or
   * `Ok(x)` and `Ok(y)`, where `x` and `y` are equal.
   *
   * By default, `x` and `y` are compared with `equal` if they both contain
   * `Result` values; otherwise they are compared using `===`.
   *
   * If `okCmp` is supplied, it is used in place of the default equality logic
   * for `Ok` values. If `errCmp` is supplied, it is used in place of the
   * default equality logic for `Err` values.
   */
  equals<U, F>(
    that: Result<U, F>,
    okCmp?: (aValue: T, bValue: U) => boolean,
    errCmp?: (aError: E, bError: F) => boolean,
  ): boolean {
    if (this.isOk() && that.isOk()) {
      return okCmp
        ? okCmp(this.value, that.value)
        : isResult(this.value) && isResult(that.value)
        ? this.value.equals(that.value)
        : (this.value as unknown) === (that.value as unknown);
    }
    if (this.isErr() && that.isErr()) {
      return errCmp
        ? errCmp(this.error, that.error)
        : isResult(this.error) && isResult(that.error)
        ? this.error.equals(that.error)
        : (this.error as unknown) === (that.error as unknown);
    }
    return false;
  }

  /**
   * If `this` is `Err(e)`, returns `Some(e)`, otherwise returns `None()`.
   */
  abstract err(): Option<E>;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  abstract expect(message: string | (() => string)): T;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise throws `Error(message)`
   * or `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  abstract expectErr(message: string | (() => string)): E;

  /**
   * An alias of `andThen`.
   */
  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Result<R, E | RE> {
    return this.andThen(f);
  }

  /**
   * Flatten the structures of a nested `Option` using thse rules:
   *
   * - `Ok(Ok(x))` ↦ `Ok(x)`
   * - `Ok(Err(e1))` ↦ `Err(e1)`
   * - `Err(e2)` ↦ `Err(e2)`
   *
   * Equivalent to `this.andThen(x => x)`.
   */
  abstract flatten<T, E1, E2>(
    this: Result<Result<T, E1>, E2>,
  ): Result<T, E1 | E2>;

  /**
   * Tests whether `this` is `Err(e)`.
   */
  abstract isErr(): this is Err<T, E>;

  /**
   * Tests whether `this` is an `Err(e)` for which `p(e)` is a truthy value.
   */
  abstract isErrAnd(p: (error: E) => unknown): boolean;

  /**
   * Tests whether `this` is `Ok(_)`.
   */
  abstract isOk(): this is Ok<T, E>;

  /**
   * Tests whether `this` is an `Ok(x)` for which `p(x)` is a truthy value.
   */
  abstract isOkAnd(p: (value: T) => unknown): boolean;

  /**
   * If `this` is `Ok(x)`, returns `Ok(f(x))`, otherwise returns `this`.
   */
  abstract map<R>(f: (value: T) => R): Result<R, E>;

  /**
   * If `this` is `Err(e)`, returns `Err(f(e))`, otherwise returns
   * `this`.
   */
  abstract mapErr<R>(f: (error: E) => R): Result<T, R>;

  /**
   * If `this` is `Ok(x)`, returns `fromNullableOr(f(x))`, otherwise returns
   * `Err(error)`.
   */
  abstract mapNullableOr<D, R>(
    defaultError: D,
    f: (value: T) => R | undefined | null,
  ): Result<NonNullable<R>, D | E>;

  /**
   * If `this` is `Ok(x)`, returns `fromNullableOrElse(d, f(x))`, otherwise returns
   * `Err(error)`.
   */
  abstract mapNullableOrElse<D, R>(
    d: () => D,
    f: (value: T) => R | undefined | null,
  ): Result<NonNullable<R>, D | E>;


  /**
   * Returns `f(x)` if `this` is `Some(x)`, otherwise returns `d`.
   */
  abstract mapOr<D, R>(d: D, f: (value: T) => R): R | D
  
  /**
   * Returns `f(x)` if `this` is `Some(x)`, otherwise returns `d()`.
   */
  abstract mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): R|D;

  /**
   * If `this` is `Ok(x)`, returns `Some(x)`, otherwise returns `None()`.
   */
  abstract ok(): Option<T>;

  /**
   * If `this` is `Ok(_)`, returns `this`, otherwise returns
   * `other`.
   */
  abstract or<T2, E2>(other: Result<T2, E2>): Result<T | T2, E | E2>;

  /**
   * If `this` is `Ok(_)`, returns `this`, otherwise returns
   * `d(x)` where `x` is the error value of `this`.
   */
  abstract orElse<R, RE>(d: (error: E) => Result<R, RE>): Result<T | R, E | RE>;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise throws an error. If
   * `ErrorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  abstract unwrapErr(errorFactory?: () => unknown): E;

  /**
   * If `this` is `Err(e)`, returns `e`, otherwise returns `undefined as E`.
   */
  abstract unwrapErrUnchecked(): E;

  /**
   * Calls `f(e)` for its side effects if `this` is `Err(e)`.
   *
   * Roughly equivalent to `this.mapOrElse(f, () => {})`.
   *
   * @see {@link tap}, {@link tapOk}, {@link mapOrElse}
   */
  abstract tapErr(f: (error: E) => void): this;

  /**
   * Alias of {@link tapValue}.
   */
  abstract tapOk(f: (value: T) => void): this;

  /**
   abstract * If `this` is `Ok(x)`, returns a promise that resolves to `x`; if `this` is
   * `Err(e)`, returns a promise that rejects with `e`.
   */
  abstract toPromise(): Promise<T>;

  /**
   * Performs the following translation:
   *
   * - `Ok(None())` ↦ `None()`
   * - `Ok(Some(x))` ↦ `Some(Ok(x))`
   * - `Err(e)` ↦ `Some(Err(e))`
   *
   */
  abstract transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>>;
}

/**
 * The implemention of the {@link Ok} type.
 */
class OkImpl<T, E> extends ResultBase<T, E> {
  constructor(
    /**
     * The value contained in this object.
     */
    readonly value: T,
  ) {
    super();
  }

  and<T2, E2>(other: Result<T2, E2>): Result<T2, E2> {
    return other;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Result<R, E | RE> {
    return f(this.value);
  }

  err(): Option<E> {
    return None();
  }

  expect(message: string | (() => string)): T {
    return this.value;
  }

  expectErr(message: string | (() => string)): E {
    throw Error(typeof message === "string" ? message : message());
  }

  flatten<T, E1, E2>(this: Result<Result<T, E1>, E2>): Result<T, E1 | E2> {
    const self = this as Ok<Result<T, E1>, E2>;
    return self.value;
  }

  isErr(): this is Err<T,E> {
    return false;
  }

  isErrAnd(p: (error: E) => unknown): boolean {
    return false;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isOkAnd(p: (value: T) => unknown): boolean {
    return Boolean(p(this.value));
  }

  map<R>(f: (value: T) => R): Result<R, E> {
    return new OkImpl(f(this.value));
  }

  mapErr<R>(f: (error: E) => R): Result<T, R> {
    return this as unknown as Ok<T, R>;
  }

  mapNullableOr<D, R>(
    defaultError: D,
    f: (value: T) => R | undefined | null,
  ): Result<NonNullable<R>, D | E> {
    return Option.fromNullable(f(this.value)).okOr(defaultError);
  }

  mapNullableOrElse<D, R>(
    d: () => D,
    f: (value: T) => R | undefined | null,
  ): Result<NonNullable<R>, D | E> {
    return Option.fromNullable(f(this.value)).okOrElse(d);
  }

  mapOr<D, R>(d: D, f: (value: T) => R): R | D{
    return f(this.value);
  }

  mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): R | D{
    return f(this.value);
  }

  tapErr(f: (error: E) => void): this {
    return this;
  }

  tapOk(f: (value: T) => void): this {
    f(this.value);
    return this;
  }

  toPromise(): Promise<T> {
    return Promise.resolve(this.value);
  }

  toString(): string {
    return `Ok(${this.value})`;
  }

  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>> {
    return this.unwrapUnchecked().mapOrElse(
      () => None(),
      (value) => Some(Ok(value)),
    );
  }

  ok(): Option<T> {
    return Some(this.value);
  }

  or<T2, E2>(other: Result<T2, E2>): Result<T | T2, E | E2> {
    return this;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Result<T | R, E | RE> {
    return this;
  }

  /**
   * Returns `this` with `E` converted to `E2`.  This operation is type-safe and
   * always succeeds.
   */
  withErrType<E2>(): Result<T, E2> {
    return this as any;
  }

  unwrap(errorFactory?: () => unknown): T {
    return this.value;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    throw errorFactory ? errorFactory() : Error("Missing error value");
  }

  unwrapErrUnchecked(): E {
    return undefined as E;
  }
}

/**
 * The implementation of the {@link Err} type.
 */
class ErrImpl<T, E> extends ResultBase<T, E> {
  constructor(
    /**
     * The error value contained in this object.
     */
    readonly error: E,
  ) {
    super();
  }

  and<T2, E2>(other: Result<T2, E2>): Result<T | T2, E | E2> {
    return this;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Result<R, E | RE> {
    return this.withType<R>();
  }

  err(): Option<E> {
    return Some(this.error);
  }

  expect(message: string | (() => string)): T {
    throw Error(typeof message === "string" ? message : message());
  }

  expectErr(message: string | (() => string)): E {
    return this.error;
  }

  flatten<T, E1, E2>(this: Result<Result<T, E1>, E2>): Result<T, E1 | E2> {
    return this as any;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  isErrAnd(p: (error: E) => unknown): boolean {
    return Boolean(p(this.error));
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isOkAnd(p: (value: T) => unknown): boolean {
    return false;
  }


  map<R>(f: (value: T) => R): Result<R, E> {
    return this as unknown as Err<R, E>;
  }

  mapErr<R>(f: (error: E) => R): Err<T, R> {
    return new ErrImpl(f(this.error));
  }


  mapNullableOr<D, R>(
    defaultError: D,
    f: (value: T) => R | undefined | null,
  ): Result<NonNullable<R>, D | E> {
    return this as any;
  }

  mapNullableOrElse<D, R>(
    d: () => D,
    f: (value: T) => R | undefined | null,
  ): Err<NonNullable<R>, D | E> {
    return this as any;
  }

  mapOr<D, R>(d: D, f: (value: T) => R): R | D {
    return d;
  }

  mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): R | D {
    return d(this.error);
  }

  ok(): Option<T> {
    return None();
  }

  or<T2, E2>(other: Result<T2, E2>): Result<T | T2, E | E2> {
    return other;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Result<T | R, E | RE> {
    return d(this.error);
  }

  tapErr(f: (error: E) => void): this {
    f(this.error);
    return this;
  }

  tapOk(f: (value: T) => void): this {
    return this;
  }

  toPromise(): Promise<T> {
    return Promise.reject(this.error);
  }

  toString(): string {
    return `Err(${this.error})`;
  }

  transpose<T, E>(this: Result<Option<T>, E>): Option<Result<T, E>> {
    return Some(Err(this.unwrapErrUnchecked()));
  }

  unwrap(errorFactory?: () => unknown): T {
    throw errorFactory ? errorFactory() : this.error;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    return this.error;
  }

  unwrapErrUnchecked(): E {
    return this.error;
  }

  /**
   * Returns `this` with `T` converted to `T2`.  This operation is type-safe and
   * always succeeds.
   */
  withType<T2>(): Err<T2, E> {
    return this as any;
  }
}
