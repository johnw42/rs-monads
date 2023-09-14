import { Err, Ok, Result, constErr, constOk } from "./Result";
import { Tappable } from "./Tappable";

/**
 * A type that can contain a single value or no value.
 */
export type Option<T> = Some<T> | None<T>;

/**
 * The subtype of `Option<T>` that contains a value.
 */
export type Some<T> = SomeImpl<T>;

/**
 * The subtype of `Option<T>` that does not contain a value.
 */
export type None<T> = NoneImpl<T>;

/**
 * Returns an instance of `Some` whose value is `value`.
 *
 * The return type uses `Option` rather than `Some` to avoid constraining the
 * type of variables initialized by a call to this function.
 *
 * @see {@link constSome}
 */
export function Some<T>(value: T): Option<T> {
  return new SomeImpl(value);
}

/**
 * Returns an instance of `None`.
 *
 * The return type uses `Option` rather than `None` to avoid constraining the
 * type of variables initialized by a call to this function.
 *
 * @see {@link constNone}
 */
export function None<T>(): Option<T> {
  return NONE as any;
}

/**
 * Same as {@link Some}, but returns a more specific type.
 */
export function constSome<T>(value: T): Some<T> {
  return new SomeImpl(value);
}

/**
 * Same as {@link None}, but returns a more specific type.
 */
export function constNone<T>(): None<T> {
  return NONE as any;
}

/**
 * Tests wether an unknown value is an instance of `Option`.
 */
export function isOption(arg: unknown): arg is Option<unknown> {
  return arg instanceof SomeImpl || arg instanceof NoneImpl;
}

export function isSome(arg: unknown): arg is Some<unknown> {
  return arg instanceof SomeImpl;
}

export function isNone(arg: unknown): arg is None<unknown> {
  return arg instanceof NoneImpl;
}

/**
 * Given an object, returns a new object with the same keys whose corresponding
 * values are wrapped with `Some`.
 *
 * For example, `{ a: 42, b: "xyzzy" }` ↦ `{ a: Some(42), b: Some("xyzzy") }`
 */
export function wrapFields<R extends object, P extends Partial<R> = Partial<R>>(
  obj: Readonly<P>,
): Option.WrapFields<P>;

/**
 * Given an object, returns a new object with the same keys whose corresponding
 * values are wrapped with `Some`, merged with `defaults`, an object whose
 * values are `Option` values.  If a field is present in both `obj` and
 * `defaults`, the value from `obj` takes precedence.
 *
 * For example, when `obj` is `{ a: 42, b: "xyzzy" }` and `defaults` is `{ b:
 * Some("default"), c: None() }`, the result is `{ a: Some(42), b: Some("xyzzy"), c:
 * None() }`.
 */
export function wrapFields<
  R extends object,
  P extends Partial<R> = Partial<R>,
  D extends Option.WrapFields<object> = Option.WrapFields<Partial<R>>,
>(obj: Readonly<P>, defaults: Readonly<D>): Option.WrapFields<P> & D;

export function wrapFields(obj: object, defaults?: object): object {
  const partial = Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, Some(value)]),
  );
  return defaults ? { ...defaults, ...partial } : partial;
}

/**
 * Given an object whose fields are `Option` values, returns an object with a
 * subset of the original keys and whose values are the unwrapped contents of
 * the fields with `Some` values.
 *
 * For example, `{ a: Some(42), b: None() }` becomes `{ a: 42 }`.
 */
export function unwrapFields<R extends object>(
  obj: Option.WrapFields<R>,
): Partial<R> {
  return Object.fromEntries(
    Object.entries(obj).flatMap(([key, option]) =>
      Array.from((option as Option<unknown>).map((value) => [key, value])),
    ),
  ) as any;
}

/**
 * Returns `Some(nullable)` unless `nullable` is null or undefined; otherwise returns `None()`.
 */
export function fromNullable<T>(nullable: T): Option<NonNullable<T>> {
  return nullable == null ? None() : Some(nullable);
}

/**
 * Collects `x` for every `Some(x)` up to the first `None()` into an array `a`.
 * Stops at the first `None()` and returns `None()`, otherwise returns
 * `Some(a)`.
 *
 * This operation is useful in scenarios where `None()` represents failure.
 *
 * @see {@link Result.fromResults}
 */
export function fromOptions<T>(options: Iterable<Option<T>>): Option<T[]> {
  const items: T[] = [];
  for (const option of options) {
    if (option.isSome()) {
      items.push(option.value);
    } else {
      return option.withType<T>();
    }
  }
  return Some(items);
}

/**
 * Collects `x` for every `Some(x)` in `options` into a new array which is then
 * returned.
 */
export function extractSomes<T>(options: Iterable<Option<T>>): T[] {
  const items: T[] = [];
  for (const option of options) {
    if (option.isSome()) {
      items.push(option.value);
    }
  }
  return items;
}

export const Option = {
  // @copy-comment
  /**
   * Returns an instance of `Some` whose value is `value`.
   *
   * The return type uses `Option` rather than `Some` to avoid constraining the
   * type of variables initialized by a call to this function.
   *
   * @see {@link constSome}
   */
  Some,

  // @copy-comment
  /**
   * Returns an instance of `None`.
   *
   * The return type uses `Option` rather than `None` to avoid constraining the
   * type of variables initialized by a call to this function.
   *
   * @see {@link constNone}
   */
  None,

  // @copy-comment
  /**
   * Same as {@link Some}, but returns a more specific type.
   */
  constSome,

  // @copy-comment
  /**
   * Same as {@link None}, but returns a more specific type.
   */
  constNone,

  // @copy-comment
  /**
   * Returns `Some(value)` unless `value` is null or undefined; otherwise returns `None()`.
   */
  fromNullable,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Option`.
   */
  isOption,

  // @copy-comment
  isSome,

  // @copy-comment
  isNone,

  /**
   * Tests whether `a` and `b` are `Option` values which are equal according to
   * `a.equals(b, cmp)`.
   *
   * @see {@link OptionImpl#equals}
   */
  equals(
    a: unknown,
    b: unknown,
    cmp?: (aValue: unknown, bValue: unknown) => boolean,
  ): boolean {
    return isOption(a) && isOption(b) && a.equals(b, cmp);
  },

  // @copy-comment
  /**
   * Given an object, returns a new object with the same keys whose corresponding
   * values are wrapped with `Some`, merged with `defaults`, an object whose
   * values are `Option` values.  If a field is present in both `obj` and
   * `defaults`, the value from `obj` takes precedence.
   *
   * For example, when `obj` is `{ a: 42, b: "xyzzy" }` and `defaults` is `{ b:
   * Some("default"), c: None() }`, the result is `{ a: Some(42), b: Some("xyzzy"), c:
   * None() }`.
   */
  wrapFields,

  // @copy-comment
  /**
   * Given an object whose fields are `Option` values, returns an object with a
   * subset of the original keys and whose values are the unwrapped contents of
   * the fields with `Some` values.
   *
   * For example, `{ a: Some(42), b: None() }` becomes `{ a: 42 }`.
   */
  unwrapFields,
};

export namespace Option {
  // @copy-comment
  /**
   * The subtype of `Option<T>` that contains a value.
   */
  export type Some<T> = SomeImpl<T>;

  // @copy-comment
  /**
   * The subtype of `Option<T>` that does not contain a value.
   */
  export type None<T> = NoneImpl<T>;

  export type WrapFields<T extends object> = {
    [K in keyof T]: Option<T[K]>;
  };
  export type UnwrapFields<R> = {
    [K in keyof R]: R[K] extends Option<infer T> ? T : never;
  };
}

/**
 * The interface implemented by {@link Option}.
 */
abstract class OptionBase<T> extends Tappable implements Iterable<T> {
  /**
   * Tests whether `this` is `Some(_)`.
   */
  abstract isSome(): this is Some<T>;

  /**
   * Tests whether `this` is a `Some(x)` for which `p(x)` is a truthy value.
   */
  abstract isSomeAnd(p: (value: T) => unknown): boolean;

  /**
   * Tests whether `this` is `None()`.
   */
  abstract isNone(): this is None<T>;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  abstract expect(message: string | (() => string)): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise throws an error. If
   * `errorFactory` is provided, it is called to generate the value to be
   * thrown.
   */
  abstract unwrap(errorFactory?: () => unknown): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `defaultValue`.
   *
   * @see {@link #toNullable}
   */
  abstract unwrapOr<D>(defaultValue: D): D | T | undefined;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `f()`.
   */
  abstract unwrapOrElse<R>(d: () => R): T | R;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `undefined as T`.
   */
  abstract unwrapUnchecked(): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `undefined`.
   *
   * Equivalent to `this.unwrapOr(undefined)`.
   *
   * @see {@link mapOrUndef}
   */
  abstract unwrapOrUndef(): T | undefined;

  /**
   * Alias of {@link unwrapOrUndef}.
   */
  toNullable(): T | undefined {
    return this.unwrapOrUndef();
  }

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error)`.
   */
  abstract okOr<E>(error: E): Result<T, E>;

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error())`.
   */
  abstract okOrElse<E>(error: () => E): Result<T, E>;

  /**
   * If `this` is `Some(x)`, returns `Some(f(x))`, otherwise returns
   * `None()`.
   */
  abstract map<R>(f: (value: T) => R): Option<R>;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  abstract mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `d()`.
   *
   * @see {@link tapSome}, {@link tapNone}
   */
  abstract mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `undefined`.
   *
   * Equivalent to `this.map(f).toNullable()`.
   */
  abstract mapOrUndef<R>(f: (value: T) => R): R | undefined;

  /**
   * If `this` is `Some(x)`, returns `fromNullable(f(x))`, otherwise returns
   * `None()`.
   */
  abstract mapNullable<R>(
    f: (value: T) => R | undefined | null,
  ): Option<NonNullable<R>>;

  /**
   * Calls `f(x)` for its side effects if `this` is `Some(x)`.  Returns `this`.
   *
   * Roughlyquivalent to `this.mapOrElse(() => {}, f)`.
   *
   * @see {@link tap}, {@link tapNone}, {@link mapOrElse}
   */
  abstract tapSome(f: (value: T) => void): this;

  /**
   * Calls `f()` for its side effects if `this` is `None()`.  Returns `this`.
   *
   * Equivalent to `this.mapOrElse(f, () => {})`.
   *
   * @see {@link tap}, {@link tapSome}, {@link mapOrElse}
   */
  abstract tapNone(f: () => void): this;

  /**
   * If `this` is `Some(_)`, returns `other`, otherwise returns
   * `None()`.
   */
  abstract and<U>(other: Option<U>): Option<U>;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns
   * `None()`.
   */
  abstract andThen<R>(f: (value: T) => Option<R>): Option<R>;

  /**
   * An alias of `andThen`.
   */
  flatMap<R>(this: Some<T>, f: (value: T) => Some<R>): Some<R>;
  flatMap<R>(this: None<T>, f: (value: T) => Option<R>): None<R>;
  flatMap<R>(f: (value: T) => None<R>): None<R>;
  flatMap<R>(f: (value: T) => Option<R>): Option<R>;
  flatMap<R>(f: (value: T) => Option<R>): Option<R> {
    return this.andThen(f);
  }

  /**
   * Return `this` if `this` is `Some(x)` and `p(x)` returns a truthy
   * value, otherwise returns `None()`.
   */
  abstract filter(p: (value: T) => unknown): Option<T>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `other`.
   */
  abstract or<U>(other: Option<U>): Option<T> | Option<U>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `d()`.
   */
  abstract orElse<R>(d: () => Option<R>): Option<T> | Option<R>;

  /**
   abstract * If both or neither of `this` and `other` contain a value, returns `None()`;
   * otherwise returns whitchever of `this` or `other` is `Some(_)`.
   */
  abstract xor<U>(other: Option<U>): Option<T> | Option<U>;

  /**
   * If `this` is `Some(x)` and `other` is `Some(y)`, returns
   abstract * `Some([x, y])'; otherwise returns `None()`.
   */
  abstract zip<U>(other: Option<U>): Option<[T, U]>;

  /**
   * If `this` is `Some(x)` and `other` is `Some(y)`, returns
   abstract * `Some(f(x, y))'; otherwise returns `None()`.
   */
  abstract zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R>;

  /**
   * If `this` is `Some(Some(x))` returns `Some(x)`, otherwise returns `None()`.
   */
  abstract flatten<T>(this: Option<Option<T>>): Option<T>;
  abstract flatten<T>(this: Some<Some<T>>): Some<T>;
  abstract flatten<T>(this: None<Option<T>>): None<T>;
  abstract flatten<T>(this: Option<None<T>>): None<T>;

  /**
   * An alias of {@link flatten}.
   */
  join<T>(this: Option<Option<T>>): Option<T>;
  join<T>(this: Some<Some<T>>): Some<T>;
  join<T>(this: None<Option<T>>): None<T>;
  join<T>(this: Option<None<T>>): None<T>;
  join<T>(this: Option<Option<T>>): Option<T> {
    return this.flatten();
  }

  /**
   * Performs the following translation:
   *
   * - `None()` ↦ `Ok(None())`
   * - `Some(Ok(x))` ↦ `Ok(Some(x))`
   * - `Some(Err(x))` ↦ `Err(x)`
   *
   * It is the inverse of {@link Result#transpose}
   */
  abstract transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E>;

  /**
   * Tests if two `Option` values are equal, i.e. both `None()`, or `Some(x)`
   * and `Some(y)`, where `x` and `y` are equal.
   *
   * By default, `x` and `y` are compared with `equal` if they both contain
   * `Option` values; otherwise they are compared using `===`.
   *
   * If `cmp` is supplied, it is used in place of the default equality
   * logic.
   */
  equals<U>(that: Option<U>, cmp?: (aValue: T, bValue: U) => boolean): boolean {
    if (this.isNone() && that.isNone()) {
      return true;
    }
    if (this.isSome() && that.isSome()) {
      return cmp
        ? cmp(this.value, that.value)
        : isOption(this.value) && isOption(that.value)
        ? this.value.equals(that.value)
        : (this.value as unknown) === (that.value as unknown);
    }
    return false;
  }

  abstract [Symbol.iterator](): Iterator<T>;
}

/**
 * The implemention of values returned by {@link Some}.
 */
class SomeImpl<T> extends OptionBase<T> {
  constructor(
    /**
     * The value contained in this object.
     */
    readonly value: T,
  ) {
    super();
  }

  isSome(): this is Some<T> {
    return true;
  }

  isSomeAnd(p: (value: T) => unknown): boolean {
    return Boolean(p(this.value));
  }

  isNone(): false {
    return false;
  }

  expect(message: string | (() => string)): T {
    return this.value;
  }

  unwrap(errorFactory?: () => unknown): T {
    return this.value;
  }

  unwrapOr<D>(defaultValue: D): T {
    return this.value;
  }

  unwrapOrElse<R>(d: () => R): T {
    return this.value;
  }

  unwrapUnchecked(): T {
    return this.value;
  }

  unwrapOrUndef(): T {
    return this.value;
  }

  okOr<E>(error: E): Ok<T, E> {
    return constOk(this.value);
  }

  okOrElse<E>(error: () => E): Ok<T, E> {
    return constOk(this.value);
  }

  map<R>(f: (value: T) => R): Option<R> {
    return Some(f(this.value));
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrUndef<R>(f: (value: T) => R): R {
    return f(this.value);
  }

  tapSome(f: (value: T) => void): this {
    f(this.value);
    return this;
  }

  mapNullable<R>(
    f: (value: T) => R | undefined | null,
  ): Option<NonNullable<R>> {
    return Option.fromNullable(f(this.value));
  }

  tapNone(f: () => void): this {
    return this;
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<R>(f: (value: T) => Some<R>): Some<R>;
  andThen<R>(f: (value: T) => None<R>): None<R>;
  andThen<R>(f: (value: T) => Option<R>): Option<R>;
  andThen<R>(f: (value: T) => Option<R>): Option<R> {
    return f(this.value);
  }

  filter(p: (value: T) => unknown): Option<T> {
    return p(this.value) ? this : None();
  }

  or<U>(other: Option<U>): Some<T> {
    return this;
  }

  orElse<R>(f: (value: T) => Option<R>): Some<T> {
    return this;
  }

  xor<U>(other: Option<U>): Option<T> | None<U> {
    return other.isNone() ? this : constNone<U>();
  }

  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.isSome()
      ? new SomeImpl([this.value, other.value] as [T, U])
      : None();
  }

  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R> {
    return other.isSome() ? new SomeImpl(f(this.value, other.value)) : None();
  }

  flatten<T>(this: Some<Some<T>>): Some<T>;
  flatten<T>(this: None<Option<T>>): None<T>;
  flatten<T>(this: Option<None<T>>): None<T>;
  flatten<T>(this: Option<Option<T>>): Option<T>;
  flatten<T>(this: Option<Option<T>>): Option<T> {
    return this.unwrapUnchecked();
  }

  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    return this.unwrapUnchecked().mapOrElse(
      (error: E) => Err(error),
      (value: T) => Ok(constSome(value)),
    );
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }

  toString(): string {
    return `Some(${this.value})`;
  }
}

/**
 * The implemention values returned by {@link None}.
 */
class NoneImpl<T> extends OptionBase<T> {
  /**
   * Returns `this` with `T` converted to `T2`.  This operation is type-safe and
   * always succeeds.
   */
  withType<T2>() {
    return this as any;
  }

  isSome(): false {
    return false;
  }

  isSomeAnd(p: (value: T) => unknown): false {
    return false;
  }

  isNone(): true {
    return true;
  }

  expect(message: string | (() => string)): never {
    throw Error(typeof message === "string" ? message : message());
  }

  unwrap(errorFactory?: () => unknown): never {
    throw errorFactory ? errorFactory() : new Error("Missing Option value.");
  }

  unwrapOr<D>(defaultValue: D): D | undefined {
    return defaultValue;
  }

  unwrapOrElse<R>(f: () => R): R {
    return f();
  }

  unwrapUnchecked(): T {
    return undefined as T;
  }

  unwrapOrUndef(): undefined {
    return undefined;
  }

  okOr<E>(error: E): Err<T, E> {
    return constErr(error);
  }

  okOrElse<E>(error: () => E): Err<T, E> {
    return constErr(error());
  }

  map<R>(f: (value: T) => R): None<R> {
    return constNone();
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D {
    return defaultValue;
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D {
    return d();
  }

  mapOrUndef<R>(f: (value: T) => R): undefined {
    return undefined;
  }

  mapNullable<R>(f: (value: T) => R): None<NonNullable<R>> {
    return constNone();
  }

  tapSome(f: (value: T) => void): this {
    return this;
  }

  tapNone(f: () => void): this {
    f();
    return this;
  }

  and<U>(other: Option<U>): None<U> {
    return constNone();
  }

  andThen<R>(f: (value: T) => Option<R>): None<R> {
    return constNone();
  }

  filter(p: (value: T) => unknown): None<T> {
    return constNone();
  }

  or<U>(other: Option<U>): Option<U> {
    return other;
  }

  orElse<R>(f: () => Option<R>): Option<R> {
    return f();
  }

  xor<U>(other: Option<U>): Option<T> | Option<U> {
    return other.isSome() ? other : this;
  }

  zip<U>(other: Option<U>): None<[T, U]> {
    return constNone();
  }

  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): None<R> {
    return constNone();
  }

  flatten<T>(this: Option<Option<T>>): Option<T>;
  flatten<T>(this: Some<Some<T>>): Some<T>;
  flatten<T>(this: None<Option<T>>): None<T>;
  flatten<T>(this: Option<None<T>>): None<T>;
  flatten<T>(this: Option<Option<T>>): Option<T> {
    return constNone();
  }

  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    return Ok(None());
  }

  [Symbol.iterator](): Iterator<T> {
    return [].values();
  }

  toString(): string {
    return "None()";
  }
}

const NONE = new NoneImpl<NonNullable<unknown>>();
