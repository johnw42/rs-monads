import { Ok, Result } from "./Result";
import { SingletonMonad } from "./common";

/**
 * A trival monad that simply contains a single value.  This type has many of
 * the same method signatures as `Option` purely to simplify refactoring.
 *
 * The main methods of interest are {@link IdentityImpl#map},
 * {@link IdentityImpl#tap}
 * {@link IdentityImpl#tapIdentity}.
 */
export type Identity<T> = IdentityImpl<T>;

/**
 * Constructs a new `Identity` object with the given value.
 */
export function Identity<T>(value: T): Identity<T> {
  return new IdentityImpl(value);
}

/**
 * Tests whether `a` and `b` are `Identity` objects that are equal according to
 * `a.equals(b, cmp)`.
 *
 * @see {@link IdentityImpl#equals}
 */
Identity.equals = (
  a: unknown,
  b: unknown,
  cmp?: (a: unknown, b: unknown) => boolean,
): boolean => {
  return isIdentity(a) && isIdentity(b) && a.equals(b, cmp);
};

/**
 * Tests whether `arg` is an `Identity` object
 */
export function isIdentity(arg: unknown): arg is Identity<unknown> {
  return arg instanceof IdentityImpl;
}

// @copy-comment
/**
 * Tests whether `arg` is an `Identity` object
 */
Identity.isIdentity = isIdentity;

/**
 * Collects `x` for every `Identity(x)` into an array `a`. and returns
 * `Identity(a)`.
 */
export function takeIdentities<T>(
  identities: Iterable<Identity<T>>,
): Identity<T[]> {
  return Identity(unwrapIdentities(identities));
}

// @copy-comment
/**
 * Collects `x` for every `Identity(x)` into an array `a`. and returns
 * `Identity(a)`.
 */
Identity.takeIdentities = takeIdentities;

/**
 * Collects `x` for every `Identity(x)` into an array `a`. and returns `a`.
 */
export function unwrapIdentities<T>(identities: Iterable<Identity<T>>): T[] {
  const items: T[] = [];
  for (const identity of identities) {
    items.push(identity.value);
  }
  return items;
}

// @copy-comment
/**
 * Collects `x` for every `Identity(x)` into an array `a`. and returns `a`.
 */
Identity.unwrapIdentities = unwrapIdentities;

// @copy-comment
/**
 * Collects `x` for every `Identity(x)` into an array `a`. and returns `a`.
 */
Identity.unwrapValues = unwrapIdentities;

export class IdentityImpl<T> extends SingletonMonad<T, Identity<T>, never, never> implements Iterable<T> {
  constructor(
    /**
     * The value contained in this monad.
     */
    readonly value: T,
  ) {
    super();
  }

  /**
   * Returns `f(this.value)`.
   */
  andThen<R>(f: (value: T) => Identity<R>): Identity<R> {
    return f(this.value);
  }

  /**
   * Tests if two `Identity` values are equal, i.e. `Identity(x)`
   * and `Identity(y)`, where `x` and `y` are equal.
   *
   * By default, `x` and `y` are compared with `equal` if they both contain
   * `Identity` values; otherwise they are compared using `===`.
   *
   * If `cmp` is supplied, it is used in place of the default equality
   * logic.
   */
  equals<U>(that: Identity<U>, cmp?: (a: T, b: U) => boolean): boolean {
    return cmp
      ? cmp(this.value, that.value)
      : isIdentity(this.value) && isIdentity(that.value)
      ? this.value.equals(that.value)
      : (this.value as unknown) === (that.value as unknown);
  }

  /**
   * Returns `this.value`.
   */
  expect(_: unknown): T {
    return this.value;
  }

  /**
   * Alias of {@link andThen}.
   */
  flatMap<R>(f: (value: T) => Identity<R>): Identity<R> {
    return f(this.value);
  }

  /**
   * Returns `this.value`.
   */
  flatten<T>(this: Identity<Identity<T>>): Identity<T> {
    return this.value;
  }

  /**
   * Returns `true`.
   */
  isIdentity(): boolean {
    return true;
  }

  /**
   * Returns `p(this.value)`.
   */
  isIdentityAnd(p: (arg: T) => boolean): boolean {
    return p(this.value);
  }

  /**
   * Returns `Identity(f(this.value))`.
   */
  map<R>(f: (value: T) => R): Identity<R> {
    return Identity(f(this.value));
  }

  /**
   * Returns `f(this.value)`.
   */
  mapOr<R>(_: unknown, f: (value: T) => R): R {
    return f(this.value);
  }

  /**
   * Returns `f(this.value)`.
   */
  mapOrElse<R>(_: unknown, f: (value: T) => R): R {
    return f(this.value);
  }

  /**
   * Returns `Ok(this.value)`.
   */
  okOr<E>(_: unknown): Result<T, E> {
    return Ok(this.value);
  }

  /**
   * Returns `Ok(this.value)`.
   */
  okOrElse<E>(_: () => E): Result<T, E> {
    return Ok(this.value);
  }

  toString(): string {
    return `Identity(${this.value})`;
  }

  /**
   * Returns `[this.value, other.value]`.
   */
  zip<U>(other: Identity<U>): Identity<[T, U]> {
    return Identity([this.value, other.value] as [T, U]);
  }

  /**
   * Returns `f(this.value, other.value)`.
   */
  zipWith<U, R>(other: Identity<U>, f: (a: T, b: U) => R): Identity<R> {
    return Identity(f(this.value, other.value));
  }
}
