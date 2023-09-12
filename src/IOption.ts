import { Some, None, Option } from "./Option";
import { type Result } from "./Result";

export interface IOption<T> extends Iterable<T> {
  /**
   * Tests whether `this` is `Some(_)`.
   */
  isSome(): this is Some<T>;

  /**
   * Tests whether `this` is a `Some(x)` for which `p(x)` is a truthy value.
   */
  isSomeAnd(p: (value: T) => unknown): this is Some<T>;

  /**
   * Tests whether `this` is `None()`.
   */
  isNone(): this is None<T>;

  /**
   * If `this` is `Some(_)`, returns it, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expect(message: string | (() => string)): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrap(errorFactory?: () => unknown): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `defaultValue`.
   * 
   * @see {@link #toNullable}
   */
  unwrapOr<D>(defaultValue: D): D | T | undefined;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `f()`.
   */
  unwrapOrElse<R>(d: () => R): T | R;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `undefined`.
   * 
   * Equivalent to `this.unwrapOr(undefined)`.
   */
  toNullable(): T | undefined;

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error)`.
   */
  okOr<E>(error: E): Result<T, E>;

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error())`.
   */
  okOrElse<E>(error: () => E): Result<T, E>;

  /**
   * If `this` is `Some(x)`, returns `Some(f(x))`, otherwise returns
   * `None()`.
   */
  map<R>(f: (value: T) => R): Option<R>;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `d()`.
   */
  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Some(x)`, returns `opt(f(x))`, otherwise returns
   * `None()`.
   */
  mapNullable<R>(f: (value: T) => R | undefined | null): Option<NonNullable<R>>;

  /**
   * If `this` is `Some(x)`, returns `onSome(x)`, otherwise returns
   * `onNone()`.
   */
  match<R>(onSome: (value: T) => R, onNone: () => R): R;

  /**
   * If `this` is `Some(_)`, returns `other`, otherwise returns
   * `None()`.
   */
  and<U>(other: Option<U>): Option<U>;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `None()`.
   */
  andThen<U>(f: (value: T) => Option<U>): Option<U>;

  /**
   * An alias of `andThen`.
   */
  flatMap<U>(f: (value: T) => Option<U>): Option<U>;

  /**
   * Return `this` if `this` is `Some(x)` and `p(x)` returns a truthy
   * value, otherwise returns `None()`.
   */
  filter(p: (value: T) => unknown): Option<T>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `other`.
   */
  or<U>(other: Option<U>): Option<T> | Option<U>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `d()`.
   */
  orElse<R>(d: () => Option<R>): Option<T> | Option<R>;

  /**
   * If both or neither of `this` and `other` contain a value, returns `None()`;
   * otherwise returns whitchever of `this` or `other` is `Some(_)`.
   */
  xor<U>(other: Option<U>): Option<T> | Option<U>;

  /**
   * If `this` is `Some(x)` and `other` is `Some(y)`, returns
   * `Some([x, y])'; otherwise returns `None()`.
   */
  zip<U>(other: Option<U>): Option<[T, U]>;

  /**
   * If `this` is `Some(x)` and `other` is `Some(y)`, returns
   * `Some(f(x, y))'; otherwise returns `None()`.
   */
  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R>;

  /**
   * If `this` is `Some(some(x))` returns `Some(x)`, otherwise returns `None()`.
   */
  flatten<T>(this: Option<Option<T>>): Option<T>;

  /**
   * Performs the following translation:
   * 
   * `None()` ↦ `Ok(None())`
   *
   * `Some(Ok(x))` ↦ `Ok(Some(x))`
   * 
   * `Some(Err(x))` ↦ `Err(x)`
   * 
   * It is the inverse of {@link Result#transpose}
   */
  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E>;
}
