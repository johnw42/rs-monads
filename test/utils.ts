export type T = { T: true };
export type R = { R: true };
export type E = { E: true };
export type E2 = { E2: true };

export const theT: T = { T: true };
export const theR: R = { R: true };
export const theE: E = { E: true };
export const theE2: E2 = { E2: true };

export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export class CallCounter {
  count = 0;

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

export function expectArgs<R, A extends unknown[]>(
  result: R,
  ...expected: A
): (...actual: unknown[]) => R {
  return counter.expectArgs(result, ...expected);
}

export type SameType<T, U> = T extends U ? (U extends T ? T : never) : never;

export function expectType<T>(arg: T): jest.JestMatchers<T> {
  return expect(arg);
}
