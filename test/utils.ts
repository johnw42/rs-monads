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

export type MaybeParameters<F> = F extends (...args: infer P) => any
  ? P
  : never;
export type MaybeReturnType<F> = F extends (...args: unknown[]) => infer R
  ? R
  : never;
export type ConstructorOf<T> = { prototype: T };
export type MethodType<
  T extends HasMethods<N>,
  N extends string & keyof T,
> = T[N];
type HasMethods<K extends string> = Record<K, (...args: unknown[]) => any>;

export function testEachParams<C, A extends unknown[], R>(
  method: (this: C, ...args: A) => R,
  specs: string[],
): [string, (thisArg: C, ...args: A) => R][] {
  return specs.map((name) => [
    name,
    (thisArg: C, ...args: A): R => (thisArg as any)[name].apply(thisArg, args),
  ]);
}

export function testEachMethod<C, A extends unknown[], R>(
  method: (this: C, ...args: A) => R,
  specs: string[],
  testBody: (name: string, f: (thisArg: C, ...args: A) => R) => void,
): void {
  test.each(testEachParams(method, specs))("%s", testBody as any);
}

// export function testEachParams<
//   N extends string,
//   M extends HasMethods<N>,
//   Meth extends MethodType<M, N> = MethodType<M, N>,
//   A extends MaybeParameters<Meth> = MaybeParameters<Meth>,
//   R extends MaybeReturnType<Meth> = MaybeReturnType<Meth>,
// >(ctor: ConstructorOf<M>, names: N[]): [N, (thisArg: M, ...args: A) => R][] {
//   return names.map((name) => [
//     name,
//     (thisArg: M, ...args: A): R => ctor.prototype[name].apply(thisArg, args),
//   ]);
// }

// export function testEachMethod<
//   N extends string,
//   M extends HasMethods<N>,
//   Meth extends MethodType<M, N> = MethodType<M, N>,
//   A extends MaybeParameters<Meth> = MaybeParameters<Meth>,
//   R extends MaybeReturnType<Meth> = MaybeReturnType<Meth>,
// >(
//   ctor: ConstructorOf<M>,
//   names: N[],
//   testBody: (name: N, f: (thisArg: M, ...args: A) => R) => void,
// ): void {
//   test.each(testEachParams<M, N>(ctor, names))("%s", testBody as any);
// }

// export function testEachParams<
//   M,
//   N extends keyof M,
//   A extends MaybeParameters<M[N]> = MaybeParameters<M[N]>,
//   R extends MaybeReturnType<M[N]> = MaybeReturnType<M[N]>,
// >(names: N[]): [N, (thisArg: M, ...args: A) => R][] {
//   return names.map((name) => [
//     name,
//     (thisArg: M, ...args: A): R => (thisArg[name] as any).apply(thisArg, args),
//   ]);
// }

// export function testEachMethod<
//   M extends {},
//   N extends keyof M,
//   A extends MaybeParameters<M[N]> = MaybeParameters<M[N]>,
//   R extends MaybeReturnType<M[N]> = MaybeReturnType<M[N]>,
// >(
//   names: N[],
//   testBody: (name: N, f: (thisArg: M, ...args: A) => R) => void,
// ): void {
//   test.each(testEachParams<M,N>(names))("%s", testBody);
// }

// function testEachMethod<M, T, A extends unknown[], R>(
//   ...args: [string, (thisArg: T, ...argsA) => R][]
// ): [string, (thisArg: T, ...args: A) => R][] {
//   return args.map(([name, method]) => [
//     name,
//     (thisArg: T, ...args: A) => method.call(thisArg, ...args),
//   ]);
// }
