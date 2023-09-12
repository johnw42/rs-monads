import { type IOption } from "./IOption";
import { Err, Ok, Result, constErr, constOk } from "./Result";

/**
 * A type that can contain a single value or no value.
 */
export type Option<T> = Some<T> | None<T>;

/**
 * Subtype of Option<T> that contains a value.
 */
export type Some<T> = SomeImpl<T>;

/**
 * Subtype of Option<T> that does not contains a value.
 */
export type None<T> = NoneImpl<T>;

/**
 * Returns an instance of `Some` whose value is `value`.  The return value uses
 * `Option` rather than `Some` to avoid constraining the type of variables
 * initialize by a call to this function.
 *
 * @see {@link constSome}
 */
export function Some<T>(value: T): Option<T> {
  return new SomeImpl(value);
}

/**
 * Returns an instance of `None`.  The return value uses `Option` rather than
 * `None` to avoid constraining the type of variables initialize by a call to
 * this function.
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

export const Option = {
  /**
   * Returns `Some(value)` if `value` is not null or undefined; otherwise returns `None()`.
   */
  fromNullable<T>(value: T): Option<NonNullable<T>> {
    return value == null ? None<NonNullable<T>>() : Some(value);
  },
};

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

  isSomeAnd(p: (value: T) => unknown): this is Some<T> {
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

  toNullable(): T {
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

  match<R>(onSome: (value: T) => R, onNone: () => R): R {
    return onSome(this.value);
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
    return (this as SomeImpl<Option<T>>).value;
  }

  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    return this.unwrap().match(
      (value: T) => Ok(constSome(value)),
      (error: E) => Err(error),
    );
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }

  toString(): string {
    return `Some(${this.value})`;
  }
}

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
    throw typeof message === "string" ? message : message();
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

  toNullable(): undefined {
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

  match<R>(onSome: (value: T) => R, onNone: () => R): R {
    return onNone();
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
