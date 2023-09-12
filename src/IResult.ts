import { Err, Ok, Result } from "./Result";
import { type Option } from "./Option";

export interface IResult<T, E> extends Iterable<T> {
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
   * If `this` is `Ok(_)`, returns it, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expect(message: string | (() => string)): T;

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise throws an error. If
   * `ErrorFactory` is provided, it is called to generate the value to be
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
   * If `this` is `Err(x)`, returns `x`, otherwise throws an error. If
   * `ErrorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrapErr(errorFactory?: () => unknown): E;

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
   * If `this` is `Ok(x)`, returns `onOk(x)`, otherwise returns
   * `onErr()`.
   */
  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R;

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
   * If `this` is `Ok(x)`, returns a promise that resolves to `x`; if `this` is
   * `Err(x)`, returns a promise that rejects with `x`.
   */
  toPromise(): Promise<T>;
}
