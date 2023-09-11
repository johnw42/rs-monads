import { isOption, none, opt, some } from "../src/Option";

const anObject = { a: 0 };
const anotherObject = { b: 1 };
const thirdObject = { c: 2 };

function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

function isZero(n: number): boolean {
  return n === 0;
}

function isEq(lhs: unknown): (rhs: unknown) => boolean {
  return (rhs) => lhs === rhs;
}

describe("functions", () => {
  test("opt handles null", () => {
    expect(opt(null).isNone()).toBe(true);
  });

  test("opt handles undefined", () => {
    expect(opt(undefined).isNone()).toBe(true);
  });

  test("opt handles non-null falsy values", () => {
    expect(opt(0).unwrap()).toBe(0);
    expect(opt("").unwrap()).toBe("");
    expect(opt(false).unwrap()).toBe(false);
  });

  test("none returns a None value", () => {
    expect(none().isSome()).toBe(false);
  });

  test("some returns a Some value", () => {
    expect(some(0).isSome()).toBe(true);
  });

  test("isOption works", () => {
    expect(isOption(some(0))).toBe(true);
    expect(isOption(none())).toBe(true);
    expect(isOption(null)).toBe(false);
    expect(isOption(undefined)).toBe(false);
    expect(isOption(anObject)).toBe(false);
  });
});

describe("Some", () => {
  test("isSome", () => {
    expect(some(0).isSome()).toBe(true);
  });

  test("isSomeAnd", () => {
    expect(some(0).isSomeAnd(isZero)).toBe(true);
    expect(some(1).isSomeAnd(isZero)).toBe(false);
  });

  test("isNone", () => {
    expect(some(0).isNone()).toBe(false);
  });

  test("expect", () => {
    expect(some(anObject).expect("")).toBe(anObject);
    expect(some(anObject).expect(() => "")).toBe(anObject);
  });

  test("unwrap", () => {
    expect(some(anObject).unwrap()).toBe(anObject);
    expect(some(anObject).unwrap(() => "")).toBe(anObject);
  });

  test("unwrapOr", () => {
    expect(some(anObject).unwrapOr(anotherObject)).toBe(anObject);
  });

  test("unwrapOrElse", () => {
    expect(some(anObject).unwrapOrElse(() => anotherObject)).toBe(anObject);
  });

  test("map", () => {
    expect(
      some(anObject).map((value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }).unwrap(),
    ).toBe(anotherObject);
  });

  test("mapOr", () => {
    expect(
      some(anObject).mapOr(0, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(
      some(anObject).mapOrElse(notCalled, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("match", () => {
    expect(
      some(anObject).match((value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }, notCalled),
    ).toBe(anotherObject);
  });

  test("and", () => {
    expect(some(anObject).and(some(anotherObject)).unwrap()).toBe(anotherObject);
    expect(some(anObject).and(none()).isNone()).toBe(true);
  });

  test("andThen", () => {
    expect(
      some(anObject).andThen((value) => {
        expect(value).toBe(anObject);
        return some(anotherObject);
      }).unwrap(),
    ).toBe(anotherObject);
    expect(
      some(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return none();
        })
        .isNone(),
    ).toBe(true);
  });

  test("filter", () => {
    expect(some(anObject).filter(isEq(anObject)).unwrap()).toBe(anObject);
    expect(some(anotherObject).filter(isEq(anObject)).isNone()).toBe(true);
  });

  test("or", () => {
    expect(some(anObject).or(some(anotherObject)).unwrap()).toBe(anObject);
    expect(some(anObject).or(none()).unwrap()).toBe(anObject);
  });

  test("orElse", () => {
    expect(some(anObject).orElse(notCalled).unwrap()).toBe(anObject);
  });

  test("xor", () => {
    expect(some(anObject).xor(some(anotherObject)).isNone()).toBe(true);
    expect(some(anObject).xor(none()).unwrap()).toBe(anObject);
  });

  test("zip", () => {
    expect(some(anObject).zip(some(anotherObject)).unwrap()).toEqual([anObject, anotherObject]);
    expect(some(anObject).zip(none()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(some(anObject).zipWith(some(anotherObject), (a, b) => {
      expect(a).toBe(anObject);
      expect(b).toBe(anotherObject);
      return thirdObject;
    }).unwrap()).toBe(thirdObject);
  });

  test("join", () => {
    expect(some(some(anObject)).join().unwrap()).toBe(anObject);
  });
});
