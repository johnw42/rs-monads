export type T = { T: true };
export type R = { R: true };
export type E = { E: true };

export const theT: T = { T: true };
export const theR: R = { R: true };
export const theE: E = { E: true };

export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export function expectArgs<R, A extends unknown[]>(result: R, ...expected: A): (...actual: A) => R {
  return (...actual: A) => {
    expect(actual).toEqual(expected);
    return result;
  };
}

export type SameType<T, U> = T extends U ? (U extends T ? T : never) : never;
