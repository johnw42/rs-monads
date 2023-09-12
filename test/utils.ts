export const anObject = { T: true };
export const anotherObject = { E: true };
export const thirdObject = { R: true };

export type T = typeof anObject;
export type E = typeof anotherObject;
export type R = typeof thirdObject;

export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export function isZero(n: number): boolean {
  return n === 0;
}

export function expectArg<T, R>(expected: T, result: R): (actual: T) => R {
  return (actual: T) => {
    expect(actual).toBe(expected);
    return result;
  }
}

export type SameType<T, U> = T extends U ? (U extends T ? T : never) : never;
export type IsSameType<T, U> = T extends U ? (U extends T ? true : false) : false;
