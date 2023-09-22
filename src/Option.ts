import { Err, Ok, Result, constErr, constOk } from "./Result";
import { SingletonMonad } from "./common";

/**
 * A type that can contain a single value or no value.
 */
export type Option<T> = Some<T> | None<T>;

/**
 * The subtype of `Option<T>` that does not contain a value.
 */
export type None<T> = Option.None<T>;

/**
 * The subtype of `Option<T>` that contains a value.
 */
export type Some<T> = Option.Some<T>;

export namespace Option {
  // @copy-comment
  /**
   * The subtype of `Option<T>` that does not contain a value.
   */
  export type None<T> = NoneImpl<T>;

  // @copy-comment
  /**
   * The subtype of `Option<T>` that contains a value.
   */
  export type Some<T> = SomeImpl<T>;
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
 * Collects `x` for every `Some(x)` up to the first `None()` into an array `a`.
 * Stops at the first `None()` and returns `None()`, otherwise returns
 * `Some(a)`.
 *
 * This operation is useful in scenarios where `None()` represents failure.
 */
function collect<T>(options: Iterable<Option<T>>): Option<T[]> {
  const items: T[] = [];
  for (const option of options) {
    if (option.isSome()) {
      items.push(option.value);
    } else {
      return option.withType();
    }
  }
  return Some(items);
}

/**
 * Same as {@link None}, but returns a more specific type.
 */
export function constNone<T>(): None<T> {
  return NONE as any;
}

/**
 * Same as {@link Some}, but returns a more specific type.
 */
export function constSome<T>(value: T): Some<T> {
  return new SomeImpl(value);
}

/**
 * Returns `None()` if `x` is null or undefined, otherwise returns
 * `Some(x)`.
 */
export function fromNullable<T>(x: T): Option<NonNullable<T>> {
  return x == null ? None() : Some(x);
}

type TypeRecord = {
  bigint: bigint;
  boolean: boolean;
  number: number;
  object: object;
  string: string;
  symbol: symbol;
  undefined: undefined;
};

type TypeForName<T extends keyof TypeRecord> = TypeRecord[T];

/**
 * Tests whether `arg` is an instance of `Some`.
 */
export function isSome(arg: unknown): arg is Some<unknown> {
  return arg instanceof SomeImpl;
}

/**
 * Tests whether `arg` is an instance of `None`.
 */
export function isNone(arg: unknown): arg is None<unknown> {
  return arg instanceof NoneImpl;
}

/**
 * Tests wether an unknown value is an instance of `Option`.
 */
export function isOption(arg: unknown): arg is Option<unknown> {
  return arg instanceof SomeImpl || arg instanceof NoneImpl;
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
   * Collects `x` for every `Some(x)` up to the first `None()` into an array `a`.
   * Stops at the first `None()` and returns `None()`, otherwise returns
   * `Some(a)`.
   *
   * This operation is useful in scenarios where `None()` represents failure.
   */
  collect,

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
   * Returns `None()` if `x` is null or undefined, otherwise returns
   * `Some(x)`.
   */
  fromNullable,

  // @copy-comment
  /**
   * Tests whether `arg` is an instance of `None`.
   */
  isNone,

  // @copy-comment
  /**
   * Tests wether an unknown value is an instance of `Option`.
   */
  isOption,

  // @copy-comment
  /**
   * Tests whether `arg` is an instance of `Some`.
   */
  isSome,
};

/**
 * The interface implemented by {@link Option}.
 */
abstract class OptionBase<T> extends SingletonMonad<T> {
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
   * Tests if two `Option` values are equal, i.e. both `None()`, or `Some(x)`
   * and `Some(y)`, where `x` and `y` are equal.
   *
   * By default, `x` and `y` are compared with `equal` if they both contain
   * `Option` values; otherwise they are compared using `===`.
   *
   * If `cmp` is supplied, it is used in place of the default equality
   * logic.
   */
  abstract equals<U>(
    that: Option<U>,
    cmp?: (aValue: T, bValue: U) => boolean,
  ): boolean;

  /**
   * If `this` is `Some(x)`, returns `x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  abstract expect(message: string | (() => string)): T;

  /**
   * Return `this` if `this` is `Some(x)` and `p(x)` returns a truthy
   * value, otherwise returns `None()`.
   */
  abstract filter<P extends (value: T) => unknown>(
    p: P,
  ): P extends (arg: any) => arg is infer U ? Option<U> : Option<T>;

  /**
   * Returns `Some(value)` if `Boolean(value)`, otherwise returns `None()`.
   */
  abstract filterClass<C extends T>(ctor: {
    new (...args: any[]): C;
  }): Option<C>;

  /**
   * Returns `Some(value)` if `typeof value === typeName`, otherwise returns `None()`.
   */
  abstract filterType<K extends keyof TypeRecord>(
    this: Option<unknown>,
    typeName: K,
  ): Option<TypeForName<K>>;

  /**
   * An alias of `andThen`.
   */
  abstract flatMap<R>(f: (value: T) => Option<R>): Option<R>;

  /**
   * If `this` is `Some(Some(x))` returns `Some(x)`, otherwise returns `None()`.
   */
  abstract flatten<T>(this: Option<Option<T>>): Option<T>;

  /**
   * Tests whether `this` is `None()`.
   */
  abstract isNone(): this is None<T>;

  /**
   * Tests whether `this` is `Some(_)`.
   */
  abstract isSome(): this is Some<T>;

  /**
   * Tests whether `this` is a `Some(x)` for which `p(x)` is a truthy value.
   */
  abstract isSomeAnd(p: (value: T) => unknown): boolean;

  /**
   * If `this` is `Some(x)`, returns `Some(f(x))`, otherwise returns
   * `None()`.
   */
  abstract map<R>(f: (value: T) => R): Option<R>;

  /**
   * If `this` is `Some(x)` where `x` is not `null` or `undefined`, returns
   * `Some(x)`, otherwise returns `None()`.
   */
  abstract nonNullable(): Option<NonNullable<T>>;

  /**
   * If `this` is `Some(x)`, returns `f(x)`, otherwise returns `d()`.
   */
  abstract mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R;

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error)`.
   */
  abstract okOr<E>(error: E): Result<T, E>;

  /**
   * If `this` is `Some(x)`, returns `Ok(x)`, otherwise returns `Err(error())`.
   */
  abstract okOrElse<E>(error: () => E): Result<T, E>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `other`.
   */
  abstract or<U>(other: Option<U>): Option<T | U>;

  /**
   * If `this` is `Some(_)`, returns `this`, otherwise returns
   * `d()`.
   */
  abstract orElse<R>(d: () => Option<R>): Option<T | R>;

  /**
   * Alias of {@link tapNoValue}.
   */
  tapNone(f: () => void): this {
    if (this.isNone()) {
      f();
    }
    return this;
  }

  /**
   * Alias of {@link tapValue}.
   */
  tapSome(f: (value: T) => void): this {
    if (this.isSome()) {
      f(this.value);
    }
    return this;
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
   abstract * If both or neither of `this` and `other` contain a value, returns `None()`;
   * otherwise returns whitchever of `this` or `other` is `Some(_)`.
   */
  abstract xor<U>(other: Option<U>): Option<T | U>;

  // TODO
  abstract unzip<T, U>(this: Option<[T, U]>): [Option<T>, Option<U>];

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

  and<U>(other: Some<U>): Some<U>;
  and<U>(other: None<U>): None<U>;
  and<U>(other: Option<U>): Option<U>;
  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<R>(f: (value: T) => Some<R>): Some<R>;
  andThen<R>(f: (value: T) => None<R>): None<R>;
  andThen<R>(f: (value: T) => Option<R>): Option<R>;
  andThen<R>(f: (value: T) => Option<R>): Option<R> {
    return f(this.value);
  }

  // equals<U>(that: None<U>, cmp?: (aValue: T, bValue: U) => unknown): false;
  // equals<U>(that: Option<U>, cmp?: (aValue: T, bValue: U) => unknown): boolean;
  equals<U>(that: Option<U>, cmp?: (aValue: T, bValue: U) => unknown): boolean {
    if (that.isSome()) {
      return cmp
        ? Boolean(cmp(this.value, that.value))
        : isOption(this.value) && isOption(that.value)
        ? this.value.equals(that.value)
        : (this.value as unknown) === (that.value as unknown);
    }
    return false;
  }

  expect(message: string | (() => string)): T {
    return this.value;
  }

  filter<P extends (value: T) => unknown>(
    p: P,
  ): P extends (arg: any) => arg is infer U ? Option<U> : Option<T> {
    return p(this.value) ? (this as any) : None();
  }

  filterClass<C extends T>(ctor: { new (...args: any[]): C }): Option<C> {
    return this.filter((x): x is C => x instanceof ctor);
  }

  filterType<K extends keyof TypeRecord>(
    this: Option<unknown>,
    typeName: K,
  ): Option<TypeForName<K>> {
    return this.filter((x) => typeof x === typeName) as any;
  }

  flatMap<R>(f: (value: T) => Some<R>): Some<R>;
  flatMap<R>(f: (value: T) => None<R>): None<R>;
  flatMap<R>(f: (value: T) => Option<R>): Option<R>;
  flatMap<R>(f: (value: T) => Option<R>): Option<R> {
    return this.andThen(f);
  }

  flatten<T>(this: Option<Some<T>>): Some<T>;
  flatten<T>(this: Option<None<T>>): None<T>;
  flatten<T>(this: Option<Option<T>>): Option<T>;
  flatten<T>(this: Option<Option<T>>): Option<T> {
    return this.unwrapUnchecked();
  }

  isNone(): false {
    return false;
  }

  isSome(): this is Some<T> {
    return true;
  }

  isSomeAnd(p: (value: T) => unknown): boolean {
    return Boolean(p(this.value));
  }

  map<R>(f: (value: T) => R): Some<R> {
    return constSome(f(this.value));
  }

  mapOr<D, R>(d: D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrUndef<R>(f: (value: T) => R): R {
    return f(this.value);
  }

  nonNullable(): Option<NonNullable<T>> {
    return this.value == null ? None() : (this as any);
  }

  okOr<E>(error: E): Ok<T, E> {
    return constOk(this.value);
  }

  okOrElse<E>(error: () => E): Ok<T, E> {
    return constOk(this.value);
  }

  or<U>(other: Option<U>): Some<T> {
    return this;
  }

  orElse<R>(f: (value: T) => Option<R>): Some<T> {
    return this;
  }

  toNullable(): T {
    return this.value;
  }

  toString(): string {
    return `Some(${this.value})`;
  }

  transpose<T, E>(this: Option<Ok<T, E>>): Ok<Some<T>, E>;
  transpose<T, E>(this: Option<Err<T, E>>): Err<Some<T>, E>;
  transpose<T, E>(this: Option<Result<T, E>>): Result<Some<T>, E>;
  transpose<T, E>(this: Option<Result<T, E>>): Result<Some<T>, E> {
    return this.unwrapUnchecked().mapOrElse(
      (error: E) => Err(error),
      (value: T) => Ok(constSome(value)),
    );
  }

  unwrap(lazyError?: () => unknown): T {
    return this.value;
  }

  unwrapOr<D>(defaultValue: D):  T {
    return this.value;
  }

  unwrapOrElse<R>(d: () => R): T {
    return this.value
  }

  unwrapOrUndef(): T {
    return this.value;
  }

  unwrapUnchecked(): T {
    return this.value;
  }

  unzip<T, U>(this: Option<[T, U]>): [Some<T>, Some<U>] {
    const self = this as Some<[T, U]>;
    const [left, right] = self.value;
    return [constSome(left), constSome(right)]
  }

  xor<U>(other: Some<U>): None<T & U>;
  xor<U>(other: None<U>): Some<T>;
  xor<U>(other: Option<U>): Option<T | U>;
  xor<U>(other: Option<U>): Option<T | U> {
    return other.isNone() ? this : None<U>();
  }

  zip<U>(other: Some<U>): Some<[T, U]>;
  zip<U>(other: None<U>): None<[T, U]>;
  zip<U>(other: Option<U>): Option<[T, U]>;
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.isSome() ? Some([this.value, other.value] as [T, U]) : None();
  }

  zipWith<U, R>(other: Some<U>, f: (a: T, b: U) => R): Some<R>;
  zipWith<U, R>(other: None<U>, f: (a: T, b: U) => R): None<R>;
  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R>;
  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R> {
    return other.isSome() ? Some(f(this.value, other.value)) : None();
  }
}

/**
 * The implemention values returned by {@link None}.
 */
class NoneImpl<T> extends OptionBase<T> {
  and<U>(other: Option<U>): None<U> {
    return this.withType();
  }

  andThen<R>(f: (value: T) => Option<R>): None<R> {
    return this.withType();
  }

  // equals<U>(that: None<U>, cmp?: (aValue: T, bValue: U) => boolean): true;
  // equals<U>(that: Some<U>, cmp?: (aValue: T, bValue: U) => boolean): false;
  // equals<U>(that: Option<U>, cmp?: (aValue: T, bValue: U) => boolean): boolean;
  equals<U>(that: Option<U>, cmp?: (aValue: T, bValue: U) => boolean): boolean {
    return that.isNone();
  }

  expect(message: string | (() => string)): never {
    throw Error(typeof message === "string" ? message : message());
  }

  filter<P extends (value: T) => unknown>(
    p: P,
  ): P extends (arg: any) => arg is infer U ? Option<U> : None<T> {
    return None() as any;
  }

  filterClass<C extends T>(ctor: { new (...args: any[]): C }): None<C> {
    return this.withType();
  }

  filterType<K extends keyof TypeRecord>(
    this: Option<unknown>,
    typeName: K,
  ): None<TypeForName<K>> {
    return (this as None<unknown>).withType();
  }

  flatMap<R>(f: (value: T) => Option<R>): None<R> {
    return this.withType();
  }

  flatten<T>(this: Option<Option<T>>): None<T> {
    return (this as None<unknown>).withType();
  }

  isSome(): false {
    return false;
  }

  isSomeAnd(p: (value: T) => unknown): false {
    return false;
  }

  isNone(): this is None<T> {
    return true;
  }

  map<R>(f: (value: T) => R): None<R> {
    return this.withType();
  }

  mapOr<D, R>(d: D, f: (value: T) => R): D {
    return d;
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D {
    return d();
  }

  mapOrUndef<R>(f: (value: T) => R): undefined {
    return undefined;
  }

  nonNullable(): None<NonNullable<T>> {
    return this.withType();
  }

  okOr<E>(error: E): Err<T, E> {
    return constErr(error);
  }

  okOrElse<E>(error: () => E): Err<T, E> {
    return constErr(error());
  }

  or<U>(other: Some<U>): Some<U>;
  or<U>(other: None<U>): None<U>;
  or<U>(other: Option<U>): Option<U>;
  or<U>(other: Option<U>): Option<U> {
    return other;
  }

  orElse<R>(f: () => Some<R>): Some<R>;
  orElse<R>(f: () => None<R>): None<R>;
  orElse<R>(f: () => Option<R>): Option<R>;
  orElse<R>(f: () => Option<R>): Option<R> {
    return f();
  }

  toNullable(): undefined {
    return undefined;
  }

  toString(): string {
    return "None()";
  }

  transpose<T, E>(this: Option<Result<T, E>>): Ok<None<T>, E> {
    return constOk(constNone());
  }

  unwrap(lazyError?: () => unknown): never {
    throw lazyError ? lazyError() : new Error("Missing Option value.");
  }

  unwrapOr<D>(defaultValue: D): D {
    return defaultValue;
  }

  unwrapOrElse<R>(d: () => R): R {
    return d();
  }

  unwrapOrUndef(): undefined {
    return undefined;
  }

  unwrapUnchecked(): never {
    return undefined as never;
  }

  unzip<T, U>(this: Option<[T, U]>): [None<T>, None<U>] {
    return [this, this] as any;
  }

  /**
   * Returns `this` with `T` converted to `T2`.  This operation is type-safe and
   * always succeeds.
   */
  withType<T2>(): None<T2> {
    return this as any;
  }

  xor<U>(other: None<U>): None<T & U>;
  xor<U>(other: Some<U>): Some<U>;
  xor<U>(other: Option<U>): Option<T | U>;
  xor<U>(other: Option<U>): Option<T | U> {
    return other.isSome() ? other : this;
  }

  zip<U>(other: Option<U>): None<[T, U]> {
    return this.withType();
  }

  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): None<R> {
    return this.withType();
  }
}

const NONE = new NoneImpl<NonNullable<unknown>>();
