import { Option, isOption, none, opt, some } from "../src/Option";

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
    expect(some(anObject).expect(notCalled)).toBe(anObject);
  });

  test("unwrap", () => {
    expect(some(anObject).unwrap()).toBe(anObject);
    expect(some(anObject).unwrap(notCalled)).toBe(anObject);
  });

  test("unwrapOr", () => {
    expect(some(anObject).unwrapOr(anotherObject)).toBe(anObject);
  });

  test("unwrapOrElse", () => {
    expect(some(anObject).unwrapOrElse(notCalled)).toBe(anObject);
  });

  test("okOr", () => {
    expect(some(anObject).okOr(anotherObject).unwrap()).toBe(anObject);
  });

  test("okOrElse", () => {
    expect(some(anObject).okOrElse(notCalled).unwrap()).toBe(anObject);
  });

  test("map", () => {
    expect(
      some(anObject)
        .map((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
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

  test("mapOpt", () => {
    expect(
      some(anObject)
        .mapOpt((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      some(anObject)
        .mapOpt(() => null)
        .isNone(),
    ).toBe(true);
    expect(
      some(anObject)
        .mapOpt(() => undefined)
        .isNone(),
    ).toBe(true);
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
    expect(some(anObject).and(some(anotherObject)).unwrap()).toBe(
      anotherObject,
    );
    expect(some(anObject).and(none()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(
      some(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return some(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      some(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return none();
        })
        .isNone(),
    ).toBe(true);
    expect(
      some(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return some(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      some(anObject)
        .flatMap((value) => {
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
    expect(some(anObject).zip(some(anotherObject)).unwrap()).toEqual([
      anObject,
      anotherObject,
    ]);
    expect(some(anObject).zip(none()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(
      some(anObject)
        .zipWith(some(anotherObject), (a, b) => {
          expect(a).toBe(anObject);
          expect(b).toBe(anotherObject);
          return thirdObject;
        })
        .unwrap(),
    ).toBe(thirdObject);
    expect(some(anObject).zipWith(none(), notCalled).isNone()).toBe(true);
  });

  test("join", () => {
    expect(some(some(anObject)).join().unwrap()).toBe(anObject);
    expect(some(none()).join().isNone()).toBe(true);
  });

  test("@iterator", () => {
    expect(Array.from(some(anObject))).toEqual([anObject]);
  });
});

describe("None", () => {
  test("isSome", () => {
    expect(none().isSome()).toBe(false);
  });

  test("isSomeAnd", () => {
    expect(none().isSomeAnd(notCalled)).toBe(false);
  });

  test("isNone", () => {
    expect(none().isNone()).toBe(true);
  });

  test("expect", () => {
    expect(() => none().expect("xyzzy")).toThrow("xyzzy");
    expect(() => none().expect(() => "xyzzy")).toThrow("xyzzy");
  });

  test("unwrap", () => {
    expect(() => none().unwrap()).toThrow(Error);
    expect(() => none().unwrap(() => new Error("xyzzy"))).toThrow("xyzzy");
  });

  test("unwrapOr", () => {
    expect(none().unwrapOr(anotherObject)).toBe(anotherObject);
  });

  test("unwrapOrElse", () => {
    expect(none().unwrapOrElse(() => anotherObject)).toBe(anotherObject);
  });

  test("okOr", () => {
    expect(none().okOr(anotherObject).unwrapErr()).toBe(anotherObject);
  });

  test("okOrElse", () => {
    expect(
      none()
        .okOrElse(() => anotherObject)
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("map", () => {
    expect(none().map(notCalled).isNone()).toBe(true);
  });

  test("mapOr", () => {
    expect(none().mapOr(anotherObject, notCalled)).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(none().mapOrElse(() => anotherObject, notCalled)).toBe(
      anotherObject,
    );
  });

  test("mapOpt", () => {
    expect(none().mapOpt(notCalled).isNone()).toBe(true);
  });

  test("match", () => {
    expect(none().match(notCalled, () => anotherObject)).toBe(anotherObject);
  });

  test("and", () => {
    expect(none().and(some(anotherObject)).isNone()).toBe(true);
    expect(none().and(none()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(none().andThen(notCalled).isNone()).toBe(true);
    expect(none().flatMap(notCalled).isNone()).toBe(true);
  });

  test("filter", () => {
    expect(none().filter(notCalled).isNone()).toBe(true);
  });

  test("or", () => {
    expect(none().or(some(anotherObject)).unwrap()).toBe(anotherObject);
    expect(none().or(none()).isNone()).toBe(true);
  });

  test("orElse", () => {
    expect(
      none()
        .orElse(() => some(anObject))
        .unwrap(),
    ).toBe(anObject);
    expect(
      none()
        .orElse(() => none())
        .isNone(),
    ).toBe(true);
  });

  test("xor", () => {
    expect(none().xor(some(anotherObject)).unwrap()).toBe(anotherObject);
    expect(none().xor(none()).isNone()).toBe(true);
  });

  test("zip", () => {
    expect(none().zip(some(anotherObject)).isNone()).toBe(true);
    expect(none().zip(none()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(none().zipWith(some(anotherObject), notCalled).isNone()).toBe(true);
  });

  test("join", () => {
    expect(none<Option<unknown>>().join().isNone()).toBe(true);
  });

  test("@iterator", () => {
    expect(Array.from(none())).toEqual([]);
  });
});
