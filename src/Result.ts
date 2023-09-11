import { type IResult } from "./IResult";
import { None, Some, constNone, constSome } from "./Option";

export type Result<T, E> = Ok<T, E> | Err<T, E>;

export function ok<E, T>(value: T): Result<T, E> {
  return new Ok(value);
}

export function err<T, E>(error: E): Result<T, E> {
  return new Err(error);
}

export function constOk<E, T>(value: T): Ok<T, E> {
  return new Ok(value);
}

export function constErr<T, E>(error: E): Err<T, E> {
  return new Err(error);
}

/**
 * Tests wether an unknown value is an instance of `Result`.
 */
export function isResult(arg: unknown): arg is Result<unknown, unknown> {
  return arg instanceof Ok || arg instanceof Err;
}

export namespace Result {
  export function fromPromise<T>(
    promise: Promise<T>,
  ): Promise<Result<T, unknown>> {
    return promise.then(
      (value) => ok(value),
      (error) => err(error),
    );
  }
}

export class Ok<T, E> implements IResult<T, E> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isOkAnd(p: (value: T) => unknown): this is Ok<T, E> {
    return Boolean(p(this.value));
  }

  isErr(): false {
    return false;
  }

  isErrAnd(p: (error: E) => unknown): false {
    return false;
  }

  expect(message: string | (() => unknown)): T {
    return this.value;
  }

  unwrap(errorFactory?: () => unknown): T {
    return this.value;
  }

  unwrapOr<D>(defaultValue?: D): T | D {
    return this.value;
  }

  unwrapOrElse<R>(d: (error: E) => R): T {
    return this.value;
  }

  unwrapErr(errorFactory?: () => unknown): E {
    throw errorFactory ? errorFactory() : Error("Missing error value");
  }

  ok(): Some<T> {
    return constSome(this.value);
  }

  err(): None<E> {
    return constNone();
  }

  map<R>(f: (value: T) => R): Ok<R, E> {
    return new Ok(f(this.value));
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapOrElse<D, R>(d: () => D, f: (value: T) => R): R {
    return f(this.value);
  }

  mapErr<R>(f: (error: E) => R): Result<T, R> {
    return this as unknown as Ok<T, R>;
  }

  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return onOk(this.value);
  }

  and<T2, E2>(other: Result<T2, E2>): Result<T2, E2> {
    return other;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Result<R, RE> {
    return f(this.value);
  }

  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Result<R, RE> {
    return this.andThen(f);
  }

  or<T2, E2>(other: Result<T2, E2>): Ok<T, E> {
    return this;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Ok<T, E> {
    return this;
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value].values();
  }

  toPromise(): Promise<T> {
    return Promise.resolve(this.value);
  }
}

export class Err<T, E> implements IResult<T, E> {
  constructor(readonly error: E) {}

  isOk(): false {
    return false;
  }

  isOkAnd(p: (value: T) => unknown): false {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  isErrAnd(p: (error: E) => unknown): this is Err<T, E> {
    return Boolean(p(this.error));
  }

  expect(message: string | (() => unknown)): never {
    throw typeof message === "string" ? message : message();
  }

  unwrap(errorFactory?: () => unknown): never {
    throw errorFactory ? errorFactory() : new Error("Missing Result value.");
  }

  unwrapOr<D>(defaultValue?: D): D {
    return defaultValue;
  }

  unwrapOrElse<R>(d: (error: E) => R): R {
    return d(this.error);
  }

  unwrapErr(errorFactory?: () => unknown): E {
    return this.error;
  }

  ok(): None<T> {
    return constNone();
  }

  err(): Some<E> {
    return constSome(this.error);
  }

  map<R>(f: (value: T) => R): Err<R, E> {
    return this as unknown as Err<R, E>;
  }

  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D {
    return defaultValue;
  }

  mapOrElse<D, R>(d: (error: E) => D, f: (value: T) => R): D {
    return d(this.error);
  }

  mapErr<R>(f: (error: E) => R): Err<T, R> {
    return new Err(f(this.error));
  }

  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return onErr(this.error);
  }

  and<T2, E2>(other: Result<T2, E2>): Err<T, E> {
    return this;
  }

  andThen<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> {
    return this;
  }

  flatMap<R, RE>(f: (value: T) => Result<R, RE>): Err<T, E> {
    return this.andThen(f);
  }

  or<T2, E2>(other: Result<T2, E2>): Result<T2, E2> {
    return other;
  }

  orElse<R, RE>(d: (error: E) => Result<R, RE>): Result<R, RE> {
    return d(this.error);
  }

  [Symbol.iterator](): Iterator<T> {
    return [].values();
  }

  toPromise(): Promise<T> {
    return Promise.reject(this.error);
  }
}
