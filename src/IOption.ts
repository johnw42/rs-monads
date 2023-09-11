import { Some, None, Option } from "./Option";
import { type Result } from "./Result";

export interface IOption<T> extends Iterable<T> {
  /**
   * Tests whether `this` is `some(_)`.
   */
  isSome(): this is Some<T>;
  /**
   * Tests whether `this` is `some(x)` for which `p(x)` is a truthy value.
   */
  isSomeAnd(p: (value: T) => unknown): this is Some<T>;
  /**
   * Tests whether `this` does not contain a value.
   */
  isNone(): this is None<T>;
  /**
   * If `this` is `some(_)`, returns it, otherwise throws `Error(message)`
   * or `Error(message())`.
   */
  expect(message: string | (() => string)): T;
  /**
   * If `this` is `some(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  unwrap(errorFactory?: () => unknown): T;
  /**
   * If `this` is `some(x)`, returns `x`, otherwise returns `defaultValue`.
   */
  unwrapOr<D>(defaultValue?: D): D | T | undefined;
  /**
   * If `this` is `some(x)`, returns `x`, otherwise returns `f()`.
   */
  unwrapOrElse<R>(d: () => R): T | R;
  okOr<E>(error: E): Result<T, E>;
  okOrElse<E>(error: () => E): Result<T, E>;
  /**
   * If `this` is `some(x)`, returns `some(f(x))`, otherwise returns
   * `none()`.
   */
  map<R>(f: (value: T) => R): Option<R>;
  /**
   * If `this` is `some(x)`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R;
  /**
   * If `this` is `some(x)`, returns `f(x)`, otherwise returns
   * `d()`.
   */
  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;
  /**
   * If `this` is `some(x)`, returns `opt(f(x))`, otherwise returns
   * `none()`.
   */
  mapOpt<R>(f: (value: T) => R | undefined | null): Option<NonNullable<R>>;
  /**
   * If `this` is `some(x)`, returns `onSome(x)`, otherwise returns
   * `onNone()`.
   */
  match<R>(onSome: (value: T) => R, onNone: () => R): R;
  /**
   * If `this` is `some(_)`, returns `other`, otherwise returns
   * `none()`.
   */
  and<U>(other: Option<U>): Option<U>;
  /**
   * If `this` is `some(x)`, returns `f(x)`, otherwise returns
   * `none()`.
   */
  andThen<U>(f: (value: T) => Option<U>): Option<U>;
  /**
   * An alias of `andThen`.
   */
  flatMap<U>(f: (value: T) => Option<U>): Option<U>;
  /**
   * Return `this` if `this` is `some(x)` and `p(x)` returns a truthy
   * value, otherwise returns `none()`.
   */
  filter(p: (value: T) => unknown): Option<T>;
  /**
   * If `this` is `some(_)`, returns `this`, otherwise returns
   * `other`.
   */
  or<U>(other: Option<U>): Option<T> | Option<U>;
  /**
   * If `this` is `some(_)`, returns `this`, otherwise returns
   * `d()`.
   */
  orElse<R>(d: () => Option<R>): Option<T> | Option<R>;
  /**
   * If both or neither of `this` and `other` contain a value, returns `none()`;
   * otherwise returns whitchever of `this` or `other` is `some(_)`.
   */
  xor<U>(other: Option<U>): Option<T> | Option<U>;
  /**
   * If `this` is `some(x)` and `other` is `some(y)`, returns
   * `some([x, y])'; otherwise returns `none()`.
   */
  zip<U>(other: Option<U>): Option<[T, U]>;
  /**
   * If `this` is `some(x)` and `other` is `some(y)`, returns
   * `some(f(x, y))'; otherwise returns `none()`.
   */
  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R>;
  // /**
  //  * If `this` is `some(x)` and every item in `others` is `some(_)`,
  //  * returns `some(f(x, ...ys))' where `ys` is the array of values contained in
  //  * `others`; otherwise returns `none()`.
  //  */
  // zipWith<UU extends any[], R>(
  //   others: { [I in keyof UU]: Option<UU[I]> },
  //   f: (first: T, ...rest: UU) => R,
  // ): Option<R>;
  /**
   * If `this` is `some(some(x))` returns `some(x)`, otherwise returns `none()`.
   */
  join<T>(this: Option<Option<T>>): Option<T>;
}
