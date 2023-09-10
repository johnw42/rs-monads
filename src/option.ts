interface IOption<T extends NonNullable<unknown>> extends Iterable<T> {
  readonly value: T | null | undefined;
  isSome(): this is Some<T>;
  isSomeAnd(f: (arg: T) => unknown): this is Some<T>;
  isNone(): this is None<T>;
  expect(message: string | (() => string)): T;
  unwrap(): T;
  unwrapOr<D>(defaultValue: D): D | T;
  unwrapOrElse<U>(f: () => U): T | U;
  map<U extends NonNullable<unknown>>(f: (arg: T) => U): Option<U>;
  mapOr<D, U>(defaultValue: D, f: (arg: T) => U): D | U;
  mapOrElse<D, U>(d: () => D, f: (arg: T) => U): D | U;
  match<R>(funcs: { some: (arg: T) => R; none: () => R }): R;
  and<U extends NonNullable<unknown>>(other: Option<U>): Option<U>;
  andThen<U extends NonNullable<unknown>>(f: (arg: T) => Option<U>): Option<U>;
  filter(p: (value: T) => unknown): Option<T>;
  or<U extends NonNullable<unknown>>(other: Option<U>): Option<T> | Option<U>;
  orElse<U extends NonNullable<unknown>>(
    f: (arg: T) => Option<U>,
  ): Option<T> | Option<U>;
  xor(other: Option<T>): Option<T>;
  zip<U extends NonNullable<unknown>>(other: Option<U>): Option<[T, U]>;
  zipWith<U extends NonNullable<unknown>, R extends NonNullable<unknown>>(
    other: Option<U>,
    f: (a: T, b: U) => R,
  ): Option<R>;
}

export type Option<T extends NonNullable<unknown>> = Some<T> | None<T>;

const TAG = Symbol("OptionTag");

export class Some<T extends NonNullable<unknown>> implements IOption<T> {
  [TAG]: null = null;

  constructor(readonly value: T) {
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }

  isSome(): true {
    return true;
  }

  isSomeAnd(f: (arg: T) => unknown): boolean {
    return Boolean(f(this.value));
  }

  isNone(): false {
    return false;
  }

  expect(message: string | (() => string)): T {
    return this.value;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr<D>(defaultValue: D): T {
    return this.value;
  }

  unwrapOrElse<U>(f: () => U): T {
    return this.value;
  }

  map<U extends NonNullable<unknown>>(f: (arg: T) => U): Option<U> {
    return opt(f(this.value));
  }

  mapOr<D, U>(defaultValue: D, f: (arg: T) => U): U {
    return f(this.value);
  }

  mapOrElse<D, U>(d: () => D, f: (arg: T) => U): U {
    return f(this.value);
  }

  match<R>(funcs: { some: (arg: T) => R; none: () => R }): R {
    return funcs.some(this.value);
  }

  and<U extends NonNullable<unknown>>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<U extends NonNullable<unknown>>(f: (arg: T) => Option<U>): Option<U> {
    return f(this.value);
  }

  filter(p: (value: T) => unknown): Option<T> {
    return p(this.value) ? this : (NONE as Option<T>);
  }

  or<U extends NonNullable<unknown>>(other: Option<U>): Some<T> {
    return this;
  }

  orElse<U extends NonNullable<unknown>>(f: (arg: T) => Option<U>): Some<T> {
    return this;
  }

  xor(other: Option<T>): Option<T> {
    return other.isNone() ? this : other;
  }

  zip<U extends NonNullable<unknown>>(other: Option<U>): Option<[T, U]> {
    return other.isSome()
      ? new Some([this.value, other.value] as [T, U])
      : (NONE as Option<[T, U]>);
  }

  zipWith<U extends NonNullable<unknown>, R extends NonNullable<unknown>>(
    other: Option<U>,
    f: (a: T, b: U) => R,
  ): Option<R> {
    return other.isSome()
      ? new Some(f(this.value, other.value))
      : (NONE as Option<R>);
  }
}

export class None<T extends NonNullable<unknown>> implements IOption<T> {
  [TAG]: null = null;

  [Symbol.iterator](): Iterator<T> {
    return [].values();
  }

  get value(): undefined {
    return undefined;
  }

  isSome(): false {
    return false;
  }

  isSomeAnd(f: (arg: T) => unknown): false {
    return false;
  }

  isNone(): true {
    return true;
  }

  expect(message: string | (() => string)): never {
    throw typeof message === "string" ? message : message();
  }

  unwrap(): T {
    throw new Error("Missing Option value.");
  }

  unwrapOr<D>(defaultValue: D): D {
    return defaultValue;
  }

  unwrapOrElse<U>(f: () => U): U {
    return f();
  }

  map<U extends NonNullable<unknown>>(f: (arg: T) => U): Option<U> {
    return NONE as Option<U>;
  }

  mapOr<D, U>(defaultValue: D, f: (arg: T) => U): D {
    return defaultValue;
  }

  mapOrElse<D, U>(d: () => D, f: (arg: T) => U): D {
    return d();
  }

  match<R>(funcs: { some: (arg: T) => R; none: () => R }): R {
    return funcs.none();
  }

  and<U extends NonNullable<unknown>>(other: Option<U>): Option<U> {
    return NONE as Option<U>;
  }

  andThen<U extends NonNullable<unknown>>(f: (arg: T) => Option<U>): Option<U> {
    return NONE as Option<U>;
  }

  filter(p: (value: T) => unknown): Option<T> {
    return NONE as Option<T>;
  }

  or<U extends NonNullable<unknown>>(other: Option<U>): Option<U> {
    return other;
  }

  orElse<U extends NonNullable<unknown>>(f: (arg: T) => Option<U>): Option<T> {
    return this;
  }

  xor(other: Option<T>): Option<T> {
    return other.isSome() ? this : other;
  }

  zip<U extends NonNullable<unknown>>(other: Option<U>): None<[T, U]> {
    return NONE as None<[T, U]>;
  }

  zipWith<U extends NonNullable<unknown>, R extends NonNullable<unknown>>(
    other: Option<U>,
    f: (a: T, b: U) => R,
  ): None<R> {
    return NONE as None<R>;
  }
}

const NONE = new None<NonNullable<unknown>>();

export function opt<T extends NonNullable<unknown>>(
  value: T | undefined | null,
): Option<T> {
  return value == null ? (NONE as None<T>) : new Some(value);
}

export function some<T extends NonNullable<unknown>>(value: T): Some<T> {
  return new Some(value);
}

export function none<T extends NonNullable<unknown>>(): None<T> {
  return NONE as None<T>;
}
