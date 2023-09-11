import { type IOption } from "./IOption";
import { Err, Ok } from "./Result";

/**
 * A type that can contain 0 or 1 values.
 */
export type Option<T> = Some<T> | None<T>;

/**
 * Returns `some(value)` if `value` is not null or undefined; otherwise returns `none()`.
 */
export function opt<T>(value: T): Option<NonNullable<T>> {
  return value == null ? none<NonNullable<T>>() : some(value);
}

/**
 * Returns an instance of `Some` whose value is `value`.  The return value uses
 * `Option` rather than `Some` to avoid constraining the type of variabled
 * initialize by a call to this function.
 */
export function some<T>(value: T): Option<T> {
  return new Some(value);
}

/**
 * Returns an instance of `None`.  The return value uses `Option` rather than
 * `None` to avoid constraining the type of variabled initialize by a call to
 * this function.
 */
export function none<T>(): Option<T> {
  return NONE as Option<T>;
}

export function constSome<T>(value: T): Some<T> {
  return new Some(value);
}

export function constNone<T>(): None<T> {
  return NONE as None<T>;
}

/**
 * Tests wether an unknown value is an instance of `Option`.
 */
export function isOption(arg: unknown): arg is Option<unknown> {
  return arg instanceof Some || arg instanceof None;
}

export class Some<T> implements IOption<T> {
  constructor(readonly value: T) {}

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

  unwrapOr<D>(defaultValue?: D): T {
    return this.value;
  }

  unwrapOrElse<R>(d: () => R): T {
    return this.value;
  }

  okOr<E>(error: E): Ok<T, E> {
    return new Ok(this.value);
  }

  okOrElse<E>(error: () => E): Ok<T, E> {
    return new Ok(this.value);
  }

  map<R>(f: (value: T) => R): Option<R> {
    return some(f(this.value));
  }

  mapOpt<R>(f: (value: T) => R | undefined | null): Option<NonNullable<R>> {
    return opt(f(this.value));
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
    return p(this.value) ? this : none();
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
      ? new Some([this.value, other.value] as [T, U])
      : none();
  }

  zipWith<U, R>(other: Option<U>, f: (a: T, b: U) => R): Option<R> {
    return other.isSome() ? new Some(f(this.value, other.value)) : none();
  }

  join<T>(this: Option<Option<T>>): Option<T> {
    return (this as Some<Option<T>>).value;
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }
}

export class None<T> implements IOption<T> {
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

  unwrapOr<D>(defaultValue?: D): D | undefined {
    return defaultValue;
  }

  unwrapOrElse<R>(f: () => R): R {
    return f();
  }

  okOr<E>(error: E): Err<T, E> {
    return new Err(error);
  }

  okOrElse<E>(error: () => E): Err<T, E> {
    return new Err(error());
  }

  map<R>(f: (value: T) => R): None<R> {
    return constNone();
  }

  mapOpt<R>(f: (value: T) => R): None<NonNullable<R>> {
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

  join<T>(this: Option<Option<T>>): None<T> {
    return constNone();
  }

  [Symbol.iterator](): Iterator<T> {
    return [].values();
  }
}

const NONE = new None<NonNullable<unknown>>();
