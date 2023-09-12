export const anObject = { a: 0 };
export const anotherObject = { b: 1 };
export const thirdObject = { c: 2 };

export function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

export function isZero(n: number): boolean {
  return n === 0;
}

export function isEq(lhs: unknown): (rhs: unknown) => boolean {
  return (rhs) => lhs === rhs;
}

export type SameType<T, U> = T extends U ? (U extends T ? T : never) : never;
