/**
 * Base class of monads whose instances contain at most one value.
 */
export abstract class SingletonMonad<T> implements Iterable<T> {
  [Symbol.iterator](): Iterator<T> {
    return (this.#hasValue() ? [this.value] : []).values();
  }

  // Returns true iff `this` has a `value` field.
  #hasValue(): this is this & { value: T } {
    return "value" in this;
  }

  /**
   * If `this` is has a value returns `this.x`, otherwise throws `Error(message)` or
   * `Error(message())`.
   *
   * For the sake of clarity, the message should typically contain the word
   * "should".
   */
  expect(message: string | (() => string)): T {
    if (this.#hasValue()) {
      return this.value;
    }
    throw Error(typeof message === "string" ? message : message());
  }

  /**
   * If `this` has a non-error value `x`, returns `f(x)`, otherwise returns
   * `d`.
   */
  mapOr<D, R>(d: D, f: (value: T) => R): D | R {
    return this.#hasValue() ? f(this.value) : d;
  }

  /**
   * Shorthand for `this.mapOr(undefined, f)`.
   */
  mapOrUndef<R>(f: (value: T) => R): R | undefined {
    return this.mapOr(undefined, f);
  }

  /**
   * Calls `f(this)` for its side effect and returns `this`.
   *
   * This method is designed to be used as part of a series of chained method
   * calls to do things like log an intermediate value.  Think of the chain as a
   * pipeline and the name "tap" in the sense of "[on tap][1]""; it gives access to
   * values flowing through the pipeline without interfering with the overall
   * flow.
   *
   * @see {@link tapValue}
   *
   * [1]: https://www.merriam-webster.com/dictionary/tap#on-tap
   */
  tap(f: (thisArg: this) => void): this {
    f(this);
    return this;
  }

  /**
   * Alias of {@link unwrapOrUndef}.
   */
  toNullable(): T | undefined {
    return this.unwrapOrUndef();
  }

  abstract toString(): string;

  /**
   * Returns the value contained in this instance, or throws an exception if
   * there is no value.  If given, `lazyError` is called to create the error.
   */
  abstract unwrap(lazyError?: () => unknown): T;
  
  /**
   * If `this` is has a value `x`, returns `x`, otherwise returns `defaultValue`.
   */
  unwrapOr<D>(defaultValue: D): D | T {
    return this.#hasValue() ? this.value : defaultValue;
  }

  /**
   * If `this` is has a value `x`, returns `x`, otherwise returns `d()`.
   */
  unwrapOrElse<R>(d: () => R): T | R {
    return this.#hasValue() ? this.value : d();
  }

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `undefined as T`.
   *
   * WARNING: This method is note typesafe!
   */
  unwrapUnchecked(): T {
    return (this as any).value;
  }

  /**
   * If `this` is has a value `x`, returns `x`, otherwise returns `undefined`.
   *
   * Equivalent to `this.unwrapOr(undefined)`.
   */
  unwrapOrUndef(): T | undefined {
    return this.unwrapOr(undefined);
  }
}
