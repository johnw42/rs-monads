import { Err, Ok, Result, constErr, constOk } from "./Result";

/**
 * A type that can contain a single value or no value.
 */
export type Option<T> = Some<T> | None<T>;

export type Some<T> = SomeImpl<T>;
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
  return NONE as Option<T>;
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
  return NONE as NoneImpl<T>;
}

/**
 * Tests wether an unknown value is an instance of `Option`.
 */
export function isOption(arg: unknown): arg is Option<unknown> {
  return arg instanceof SomeImpl || arg instanceof NoneImpl;
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
  ) as Partial<R>;
}

/**
 * Returns `Some(value)` unless `value` is null or undefined; otherwise returns `None()`.
 */
export function fromNullable<T>(value: T): Option<NonNullable<T>> {
  return value == null ? None<NonNullable<T>>() : Some(value);
}

const staticMethods = {
  Some,
  None,
  constSome,
  constNone,
  isOption,
  fromNullable,
  wrapFields,
  unwrapFields,
};

export const Option: Readonly<typeof staticMethods> = staticMethods;

export namespace Option {
  export type Some<T> = SomeImpl<T>;
  export type None<T> = NoneImpl<T>;

  export type WrapFields<T extends object> = {
    [K in keyof T]: Option<T[K]>;
  };
  export type UnwrapFields<R> = {
    [K in keyof R]: R[K] extends Option<infer T> ? T : never;
  };
}

interface Matcher<T, R> {
  Some(value: T): R;
  None(): R;
}

/**
 * The interface implemented by {@link Option}.
 */
interface IOption<T> extends Iterable<T> {
  /**
   * Tests whether `this` is `Some(_)`.
   */
  isSome(): this is Some<T>;

  /**
   * Tests whether `this` is a `Some(x)` for which `p(x)` is a truthy value.
   */
  isSomeAnd(p: (value: T) => unknown): boolean;

  /**
   * Tests whether `this` is `None()`.
   */
  isNone(): this is None<T>;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
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
   * If `this` is `Some(x)`, returns `x`, otherwise returns `undefined as T`.
   */
  unwrapUnchecked(): T;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise returns `undefined`.
   *
   * Equivalent to `this.unwrapOr(undefined)`.
   */
  toNullable<T1 extends NonNullable<T>>(this: Option<T1>): T1 | undefined;

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
   * If `this` is `Some(x)`, returns `onSome(x)`, otherwise returns `onNone()`.
   *
   * Compared to the other signatures of this method, this one has the least
   * overhead, and it works best with TypeScript's inference rules.
   */
  match<R>(onSome: (value: T) => R, onNone: () => R): R;
  /**
   * If `this` is `Some(x)`, calls `m.Some(x)`.
   */
  match<R>(m: Pick<Matcher<T, R>, "Some">): void;
  /**
   * If `this` is `None()`, calls `m.None()`.
   */
  match<R>(m: Pick<Matcher<T, R>, "None">): void;
  /**
   * If `this` is `Some(x)`, returns `m.Some(x)`, otherwise returns `m.None()`.
   */
  match<R>(m: Matcher<T, R>): R;

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
   * - `None()` ↦ `Ok(None())`
   * - `Some(Ok(x))` ↦ `Ok(Some(x))`
   * - `Some(Err(x))` ↦ `Err(x)`
   *
   * It is the inverse of {@link Result#transpose}
   */
  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E>;
}

/**
 * The implemention of values returned by {@link Some}.
 */
class SomeImpl<T> implements IOption<T> {
  constructor(
    /**
     * The value contained in this object.
     */
    readonly value: T,
  ) {}

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

  toNullable<T1 extends NonNullable<T>>(this: Option<T1>): T1 {
    return this.unwrapUnchecked();
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

  mapNullable<R>(
    f: (value: T) => R | undefined | null,
  ): Option<NonNullable<R>> {
    return Option.fromNullable(f(this.value));
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  match<R>(onSome: (value: T) => R, onNone: () => R): R;
  match<R>(m: Pick<Matcher<T, R>, "Some">): void;
  match<R>(m: Pick<Matcher<T, R>, "None">): void;
  match<R>(m: Matcher<T, R>): R;
  match<R>(
    m: Partial<Matcher<T, R>> | ((value: T) => R),
    onNone?: () => R,
  ): void | R {
    if (typeof m === "function") {
      return m(this.value);
    } else if (m.Some) {
      const r = m.Some(this.value);
      return m.None ? r : undefined;
    }
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<R>(f: (value: T) => Option<R>): Option<R> {
    return f(this.value);
  }

  flatMap<R>(f: (value: T) => Option<R>): Option<R> {
    return this.andThen(f);
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

  flatten<T>(this: Option<Option<T>>): Option<T> {
    return this.unwrapUnchecked();
  }

  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    return this.unwrapUnchecked().match(
      (value: T) => {
        return Ok(constSome(value));
      },
      (error: E) => {
        return Err(error);
      },
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
class NoneImpl<T> implements IOption<T> {
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

  toNullable<T1 extends NonNullable<T>>(this: Option<T1>): undefined {
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

  mapNullable<R>(f: (value: T) => R): None<NonNullable<R>> {
    return constNone();
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D {
    return defaultValue;
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D {
    return d();
  }

  match<R>(onSome: (value: T) => R, onNone: () => R): R;
  match<R>(m: Pick<Matcher<T, R>, "Some">): void;
  match<R>(m: Pick<Matcher<T, R>, "None">): void;
  match<R>(m: Matcher<T, R>): R;
  match<R>(
    m: Partial<Matcher<T, R>> | ((value: T) => R),
    onNone?: () => R,
  ): void | R {
    if (typeof m === "function") {
      return onNone!();
    } else if (m.None) {
      const r = m.None();
      return m.Some ? r : undefined;
    }
  }

  and<U>(other: Option<U>): None<U> {
    return constNone();
  }

  andThen<R>(f: (value: T) => Option<R>): None<R> {
    return constNone();
  }

  flatMap<R>(f: (value: T) => Option<R>): None<R> {
    return this.andThen(f);
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

  flatten<T>(this: Option<Option<T>>): None<T> {
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
