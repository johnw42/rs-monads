import { Identity, isIdentity } from "../src/index";
import {
  CallCounter,
  R,
  T,
  expectArgs,
  notCalled,
  theE,
  theR,
  theT,
} from "./utils";

(expect as any).addEqualityTesters([
  function (this: any, a: unknown, b: unknown) {
    if (isIdentity(a) && isIdentity(b)) {
      return a.equals(b, this.equals);
    }
    return undefined;
  },
]);

describe("Identity functions", () => {
  test("aliases", () => {
    expect(Identity).toBe(Identity);
    expect(Identity.isIdentity).toBe(isIdentity);
  });

  test("isIdentity", () => {
    expect(isIdentity(Identity(0))).toBe(true);
    expect(isIdentity(null)).toBe(false);
    expect(isIdentity(undefined)).toBe(false);
    expect(isIdentity(theT)).toBe(false);
  });

  test("Identity.equals", () => {
    expect(Identity.equals(theT, theT)).toBe(false);
    expect(Identity.equals(Identity(theT), theT)).toBe(false);
    expect(Identity.equals(theT, Identity(theT))).toBe(false);
    testEqualsFn(Identity.equals);
  });
});

describe("Identity methods", () => {
  test("value", () => {
    expect(Identity(theT).value).toBe(theT);
  });

  test("isIdentityAnd", () => {
    expect(Identity(theT).isIdentityAnd(expectArgs(true, theT))).toBe(true);
    expect(Identity(theT).isIdentityAnd(expectArgs(false, theT))).toBe(false);
  });

  test("isIdentity", () => {
    let x = Identity(theT).isIdentity();
    expect(x).toBe(true);
    x = false;
  });

  test("expect", () => {
    expect(Identity(theT).expect("")).toBe(theT);
    expect(Identity(theT).expect(notCalled)).toBe(theT);
  });

  test("unwrap", () => {
    expect(Identity(theT).unwrap()).toBe(theT);
    expect(Identity(theT).unwrap(notCalled)).toBe(theT);
  });

  test("unwrapOr", () => {
    expect(Identity(theT).unwrapOr(theE)).toBe(theT);
  });

  test("unwrapOrElse", () => {
    expect(Identity(theT).unwrapOrElse(notCalled)).toBe(theT);
  });

  test("unwrapUnchecked", () => {
    expect(Identity(theT).unwrapUnchecked()).toBe(theT);
  });

  test.each([["unwrapOrUndef", (x: Identity<T>) => x.unwrapOrUndef()]])(
    "%s",
    (_name, unwrapOrUndef) => {
      expect(Identity(theT).unwrapOrUndef()).toBe(theT);
    },
  );

  test("okOr", () => {
    expect(Identity(theT).okOr(theE).unwrap()).toBe(theT);
  });

  test("okOrElse", () => {
    expect(Identity(theT).okOrElse(notCalled).unwrap()).toBe(theT);
  });

  test("map", () => {
    expect(Identity(theT).map(expectArgs(theR, theT)).unwrap()).toBe(theR);
  });

  test("mapOr", () => {
    expect(Identity(theT).mapOr(theE, expectArgs(theR, theT))).toBe(theR);
  });

  test("mapOrElse", () => {
    expect(Identity(theT).mapOrElse(notCalled, expectArgs(theR, theT))).toBe(
      theR,
    );
  });

  test("tap", () => {
    const some = Identity(theT);
    const someFunc = jest.fn(expectArgs(undefined, some));
    expect(some.tap(someFunc)).toBe(some);
    expect(someFunc).toHaveBeenCalledTimes(1);
  });

  test("tapIdentity", () => {
    const id = Identity(theT);
    const mockFunc = jest.fn(expectArgs(theR, theT));
    expect(id.tapIdentity(mockFunc)).toBe(id);
    expect(mockFunc).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["andThen", (x: Identity<T>, f: (arg: T) => Identity<R>) => x.andThen(f)],
    ["flatMap", (x: Identity<T>, f: (arg: T) => Identity<R>) => x.flatMap(f)],
  ])("%s", (_name, andThen) => {
    expect(
      andThen(Identity(theT), expectArgs(Identity(theR), theT)).unwrap(),
    ).toBe(theR);
    expect(andThen(Identity(theT), expectArgs(Identity(theR), theT))).toEqual(
      Identity(theR),
    );
  });

  test("zipWith", () => {
    expect(
      Identity(theT)
        .zip(Identity(theE))
        .unwrap(),
    ).toEqual([theT, theE]);
  });

  test("zipWith", () => {
    expect(
      Identity(theT)
        .zipWith(Identity(theE), expectArgs(theR, theT, theE))
        .unwrap(),
    ).toBe(theR);
  });

  test.each([
    ["flatten", (x: Identity<Identity<T>>) => x.flatten()],
    ["join", (x: Identity<Identity<T>>) => x.join()],
  ])("%s", (_name, flatten) => {
    expect(flatten(Identity(Identity(theT))).unwrap()).toBe(theT);
  });

  test("equals", () => {
    testEqualsFn((a, b, cmp) =>
      (a as Identity<unknown>).equals(b as Identity<unknown>, cmp),
    );
  });

  test("@@iterator", () => {
    expect(Array.from(Identity(theT))).toEqual([theT]);
  });

  test("toString", () => {
    expect(Identity(42).toString()).toBe("Identity(42)");
  });
});

function testEqualsFn(
  eq: (
    a: unknown,
    b: unknown,
    cmp?: (aValue: unknown, bValue: unknown) => boolean,
  ) => boolean,
) {
  expect(eq(Identity(theT), Identity(theT))).toBe(true);
  expect(eq(Identity(theT), Identity(theE))).toBe(false);

  expect(eq(Identity(Identity(theT)), Identity(Identity(theT)))).toBe(true);
  expect(eq(Identity(Identity(theT)), Identity(Identity(theE)))).toBe(false);

  for (const innerEqual of [true, false]) {
    for (const [left, right] of [
      [theT, theT],
      [theT, theE],
      [Identity(theT), Identity(theT)],
      [Identity(theT), Identity(theE)],
    ]) {
      const counter = new CallCounter();
      expect(
        eq(
          Identity(left),
          Identity(right),
          counter.expectArgs(innerEqual, left, right),
        ),
      ).toBe(innerEqual);
      expect(counter.count).toBe(1);
    }
  }
}
