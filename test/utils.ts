export type T = { T: true };
export type E = { E: true };
export type R = { R: true };

export const theT: T = { T: true };
export const theE: E = { E: true };
export const theR: R = { R: true };

export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export function expectArg<T, R>(expected: T, result: R): (actual: T) => R {
  return (actual: T) => {
    expect(actual).toBe(expected);
    return result;
  };
}

export type SameType<T, U> = T extends U ? (U extends T ? T : never) : never;
export type IsSameType<T, U> = T extends U
  ? U extends T
    ? true
    : false
  : false;
