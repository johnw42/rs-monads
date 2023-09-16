export type ValueType<M extends SingletonMonad<unknown, any>> =
  M extends SingletonMonad<infer T, any> ? T : never;

export type ErrorType<M extends SingletonMonad<unknown, any>> =
  M extends SingletonMonad<unknown, any, infer E> ? E : never;

export type ValueMonadType<M extends SingletonMonad<unknown, any>> =
  M extends SingletonMonad<unknown, infer M> ? M : never;

// export function unwrapValues<
//   T,
//   MT extends SingletonMonadWithValue<T>,
//   M extends SingletonMonad<T, MT>,
// >(seq: Iterable<M>): T[] {
//   const items: T[] = [];
//   for (const m of seq) {
//     if (m.hasValue()) {
//       items.push(m.value);
//     }
//   }
//   return items;
// }

// export type SingletonMonadWithValue<T> = { readonly value: T } & SingletonMonad<T, never>;

/**
 * Base class of monads whose instances contain at most one value.
 */
export abstract class SingletonMonad<
  T,
  MT extends { readonly value: T } & SingletonMonad<T, MT, E, ME>,
  E = never,
  ME extends SingletonMonad<T, MT, E, ME> = never,
> implements Iterable<T>
{
  [Symbol.iterator](): Iterator<T> {
    return (this.hasValue() ? [this.value] : []).values();
  }

  /**
   * Returns true iff `this` has a `value` field.
   */
  hasValue(): this is MT {
    return "value" in this;
  }

  /**
   * Returns true iff this has a `value` field and `p(this.value)`.
   */
  hasValueAnd(p: (arg: T) => unknown): boolean {
    return this.hasValue() ? Boolean(p(this.value)) : false;
  }

  /**
   * Tests whether this container has a `value` field equal to `needle`
   * (according to `===`).
   *
   * Analogous to {@link Array.includes}.
   */
  includes(needle: T): boolean {
    return this.hasValue() && this.value === needle;
  }

  /**
   * Returns 1 if `this` has a `value` field, `0` otherwise.
   */
  get length(): number {
    return +this.hasValue();
  }

  /**
   * If `this` has a non-error value `x`, returns `f(x)`, otherwise returns
   * `defaultValue`.
   */
  mapOr<D, R>(defaultValue: D, f: (value: T) => R): D | R {
    return this.hasValue() ? f(this.value) : defaultValue;
  }

  /**
   * If `this` has a non-error value `x`, returns `f(x)`, otherwise returns
   * `d()`.
   *
   * @see {@link tapValue}, {@link tapNoValue}
   */
  mapOrElse<D, R>(d: () => D, f: (value: T) => R): D | R {
    return this.hasValue() ? f(this.value) : d();
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
   * If `this` has a `value` field, called `f(this.value)`.
   *
   * @see {@link tap}
   */
  tapValue(f: (value: T) => void): this {
    if (this.hasValue()) {
      f(this.value);
    }
    return this;
  }

  /**
   * If `this` has a `value` field, called `f(this.value)`.
   *
   * @see {@link tap}
   */
  tapNoValue(f: () => void): this {
    if (!this.hasValue()) {
      f();
    }
    return this;
  }

  /**
   * Alias of {@link unwrapOrUndef}.
   */
  toNullable(): T | undefined {
    return this.unwrapOrUndef();
  }

  /**
   * Returns the value contained in this instance, or throws an exception if
   * there is no value.  If given, `lazyError` is called to create the error.
   */
  unwrap(lazyError?: () => unknown): T {
    if (this.hasValue()) {
      return this.value;
    }
    throw lazyError ? lazyError() : new Error("Missing Option value.");
  }

  /**
   * If `this` is has a value `x`, returns `x`, otherwise returns `defaultValue`.
   */
  unwrapOr<D>(defaultValue: D): D | T {
    return this.hasValue() ? this.value : defaultValue;
  }

  /**
   * If `this` is has a value `x`, returns `x`, otherwise returns `d()`.
   */
  unwrapOrElse<R>(d: () => R): T | R {
    return this.hasValue() ? this.value : d();
  }

  /**
   * If `this` is `Ok(x)`, returns `x`, otherwise returns `undefined as T`.
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
