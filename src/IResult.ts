import { Err, Ok, Result } from "./Result";
import { type Option } from "./Option";

export interface IResult<T, E> extends Iterable<T> {
  /**
   * Tests whether `this` is `ok(_)`.
   */
  isOk(): this is Ok<T, E>;
  /**
   * Tests whether `this` is `ok(x)` for which `p(x)` is a truthy value.
   */
  isOkAnd(p: (value: T) => unknown): this is Ok<T, E>;
  /**
   * Tests whether `this` does not contain a value.
   */
  isErr(): this is Err<T, E>;
  /**
   * If `this` is `ok(_)`, returns it, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expect(message: string | (() => string)): T;
  /**
   * If `this` is `ok(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrap(errorFactory?: () => unknown): T;
  /**
   * If `this` is `ok(x)`, returns `x`, otherwise returns `defaultValue`.
   */
  unwrapOr<D>(defaultValue?: D): D | T | undefined;
  /**
   * If `this` is `ok(x)`, returns `x`, otherwise returns `f()`.
   */
  unwrapOrElse<R>(d: (error: E) => R): T | R;
  ok(): Option<T>;
  err(): Option<E>;
  /**
   * If `this` is `ok(x)`, returns `ok(f(x))`, otherwise returns `this`.
   */
  map<R>(f: (value: T) => R): Result<R, E>;
  /**
   * If `this` is `ok(x)`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R;
  /**
   * If `this` is `ok(x)`, returns `f(x)`, otherwise returns
   * `d()`.
   */
  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;
  /**
   * If `this` is `err(x)`, returns `err(f(x))`, otherwise returns
   * `this`.
   */
  mapErr<R>(f: (error: E) => R): Result<T, R>;
  /**
   * If `this` is `ok(x)`, returns `onOk(x)`, otherwise returns
   * `onErr()`.
   */
  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R;
  /**
   * If `this` is `ok(_)`, returns `other`, otherwise returns
   * `this`.
   */
  and<T2, E2>(other: Result<T2, E2>): Err<T, E> | Result<T2, E2>;
  /**
   * If `this` is `ok(x)`, returns `f(x)`, otherwise returns
   * `this`.
   */
  andThen<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> | Result<R, RE>;
  /**
   * An alias of `andThen`.
   */
  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> | Result<R, RE>;
  /**
   * If `this` is `ok(_)`, returns `this`, otherwise returns
   * `other`.
   */
  or<T2, E2>(other: Result<T2, E2>): Ok<T, E> | Result<T2, E2>;
  /**
   * If `this` is `ok(_)`, returns `this`, otherwise returns
   * `d(x)` where `x` is the error value of `this`.
   */
  orElse<R, RE>(d: (error: E) => Result<R, RE>): Ok<T, E> | Result<R, RE>;
}
