export type T = { T: true };
export type R = { R: true };
export type E = { E: true };
export type E2 = { E2: true };

export const theT: T = { T: true };
export const theR: R = { R: true };
export const theE: E = { E: true };
export const theE2: E2 = { E2: true };

/**
 * A function that should never be called.
 */
export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export class CallCounter {
  /**
   * The number of times a function called by `expectArgs` has been called.
   */
  count = 0;

  /**
   * Returns a function that returns `result` and expects its arguments to be `expected`.
   */
  expectArgs<R, A extends unknown[]>(
    result: R,
    ...expected: A
  ): (...actual: unknown[]) => R {
    return (...actual: unknown[]) => {
      expect(actual).toEqual(expected);
      this.count++;
      return result;
    };
  }
}

const counter = new CallCounter();

/**
 * See {@link CallCounter.expectArgs}
 */
export function expectArgs<R, A extends unknown[]>(
  result: R,
  ...expected: A
): (...actual: unknown[]) => R {
  return counter.expectArgs(result, ...expected);
}

/**
 * Type for asserting that `T` and `U` are the exact same type.
 */
export type SameType<T, U> = T extends U ? (U extends T ? true : false) : false;
