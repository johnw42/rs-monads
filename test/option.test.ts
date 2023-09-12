import {
  constNone,
  constSome,
  isOption,
  None,
  Option,
  Some,
} from "../src/Option";

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
  test("fromNullable", () => {
    expect(Option.fromNullable(null).isNone()).toBe(true);
    expect(Option.fromNullable(undefined).isNone()).toBe(true);
    expect(Option.fromNullable(0).unwrap()).toBe(0);
    expect(Option.fromNullable("").unwrap()).toBe("");
    expect(Option.fromNullable(false).unwrap()).toBe(false);
  });

  test("None", () => {
    let x = None();
    expect(x.isSome()).toBe(false);
    x = Some(0);
  });

  test("Some", () => {
    let x = Some(0);
    expect(x.isSome()).toBe(true);
    x = None();
  });

  test("constNone", () => {
    const x: None<number> = constNone();
    expect(x.isSome()).toBe(false);
  });

  test("constSome", () => {
    const x: Some<number> = constSome(0);
    expect(x.isSome()).toBe(true);
  });

  test("isOption", () => {
    expect(isOption(Some(0))).toBe(true);
    expect(isOption(None())).toBe(true);
    expect(isOption(null)).toBe(false);
    expect(isOption(undefined)).toBe(false);
    expect(isOption(anObject)).toBe(false);
  });
});

describe("Some", () => {
  test("value", () => {
    expect(constSome(anObject).value).toBe(anObject);
    // @ts-expect-error
    expect(Some(anObject).value).toBe(anObject);
    // @ts-expect-error
    expect(None(anObject).value).toBe(undefined);
  });

  test("isSome", () => {
    expect(Some(0).isSome()).toBe(true);
  });

  test("isSomeAnd", () => {
    expect(Some(0).isSomeAnd(isZero)).toBe(true);
    expect(Some(1).isSomeAnd(isZero)).toBe(false);
  });

  test("isNone", () => {
    expect(Some(0).isNone()).toBe(false);
  });

  test("expect", () => {
    expect(Some(anObject).expect("")).toBe(anObject);
    expect(Some(anObject).expect(notCalled)).toBe(anObject);
  });

  test("unwrap", () => {
    expect(Some(anObject).unwrap()).toBe(anObject);
    expect(Some(anObject).unwrap(notCalled)).toBe(anObject);
  });

  test("unwrapOr", () => {
    expect(Some(anObject).unwrapOr(anotherObject)).toBe(anObject);
  });

  test("unwrapOrElse", () => {
    expect(Some(anObject).unwrapOrElse(notCalled)).toBe(anObject);
  });

  test("toNullable", () => {
    expect(Some(anObject).toNullable()).toBe(anObject);
  });

  test("okOr", () => {
    expect(Some(anObject).okOr(anotherObject).unwrap()).toBe(anObject);
  });

  test("okOrElse", () => {
    expect(Some(anObject).okOrElse(notCalled).unwrap()).toBe(anObject);
  });

  test("map", () => {
    expect(
      Some(anObject)
        .map((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
    ).toBe(anotherObject);
  });

  test("mapOr", () => {
    expect(
      Some(anObject).mapOr(0, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(
      Some(anObject).mapOrElse(notCalled, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapOpt", () => {
    expect(
      Some(anObject)
        .mapNullable((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Some(anObject)
        .mapNullable(() => null)
        .isNone(),
    ).toBe(true);
    expect(
      Some(anObject)
        .mapNullable(() => undefined)
        .isNone(),
    ).toBe(true);
  });

  test("match", () => {
    expect(
      Some(anObject).match((value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }, notCalled),
    ).toBe(anotherObject);
  });

  test("and", () => {
    expect(Some(anObject).and(Some(anotherObject)).unwrap()).toBe(
      anotherObject,
    );
    expect(Some(anObject).and(None()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(
      Some(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return Some(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Some(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return None();
        })
        .isNone(),
    ).toBe(true);
    expect(
      Some(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return Some(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Some(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return None();
        })
        .isNone(),
    ).toBe(true);
  });

  test("filter", () => {
    expect(Some(anObject).filter(isEq(anObject)).unwrap()).toBe(anObject);
    expect(Some(anotherObject).filter(isEq(anObject)).isNone()).toBe(true);
  });

  test("or", () => {
    expect(Some(anObject).or(Some(anotherObject)).unwrap()).toBe(anObject);
    expect(Some(anObject).or(None()).unwrap()).toBe(anObject);
  });

  test("orElse", () => {
    expect(Some(anObject).orElse(notCalled).unwrap()).toBe(anObject);
  });

  test("xor", () => {
    expect(Some(anObject).xor(Some(anotherObject)).isNone()).toBe(true);
    expect(Some(anObject).xor(None()).unwrap()).toBe(anObject);
  });

  test("zip", () => {
    expect(Some(anObject).zip(Some(anotherObject)).unwrap()).toEqual([
      anObject,
      anotherObject,
    ]);
    expect(Some(anObject).zip(None()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(
      Some(anObject)
        .zipWith(Some(anotherObject), (a, b) => {
          expect(a).toBe(anObject);
          expect(b).toBe(anotherObject);
          return thirdObject;
        })
        .unwrap(),
    ).toBe(thirdObject);
    expect(Some(anObject).zipWith(None(), notCalled).isNone()).toBe(true);
  });

  test("join", () => {
    expect(Some(Some(anObject)).join().unwrap()).toBe(anObject);
    expect(Some(None()).join().isNone()).toBe(true);
  });

  test("@iterator", () => {
    expect(Array.from(Some(anObject))).toEqual([anObject]);
  });
});

describe("None", () => {
  test("isSome", () => {
    expect(None().isSome()).toBe(false);
  });

  test("isSomeAnd", () => {
    expect(None().isSomeAnd(notCalled)).toBe(false);
  });

  test("isNone", () => {
    expect(None().isNone()).toBe(true);
  });

  test("expect", () => {
    expect(() => None().expect("xyzzy")).toThrow("xyzzy");
    expect(() => None().expect(() => "xyzzy")).toThrow("xyzzy");
  });

  test("unwrap", () => {
    expect(() => None().unwrap()).toThrow(Error);
    expect(() => None().unwrap(() => new Error("xyzzy"))).toThrow("xyzzy");
  });

  test("unwrapOr", () => {
    expect(None().unwrapOr(anotherObject)).toBe(anotherObject);
  });

  test("unwrapOrElse", () => {
    expect(None().unwrapOrElse(() => anotherObject)).toBe(anotherObject);
  });

  test("toNullable", () => {
    expect(None().toNullable()).toBe(undefined);
  });

  test("okOr", () => {
    expect(None().okOr(anotherObject).unwrapErr()).toBe(anotherObject);
  });

  test("okOrElse", () => {
    expect(
      None()
        .okOrElse(() => anotherObject)
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("map", () => {
    expect(None().map(notCalled).isNone()).toBe(true);
  });

  test("mapOr", () => {
    expect(None().mapOr(anotherObject, notCalled)).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(None().mapOrElse(() => anotherObject, notCalled)).toBe(
      anotherObject,
    );
  });

  test("mapOpt", () => {
    expect(None().mapNullable(notCalled).isNone()).toBe(true);
  });

  test("match", () => {
    expect(None().match(notCalled, () => anotherObject)).toBe(anotherObject);
  });

  test("and", () => {
    expect(None().and(Some(anotherObject)).isNone()).toBe(true);
    expect(None().and(None()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(None().andThen(notCalled).isNone()).toBe(true);
    expect(None().flatMap(notCalled).isNone()).toBe(true);
  });

  test("filter", () => {
    expect(None().filter(notCalled).isNone()).toBe(true);
  });

  test("or", () => {
    expect(None().or(Some(anotherObject)).unwrap()).toBe(anotherObject);
    expect(None().or(None()).isNone()).toBe(true);
  });

  test("orElse", () => {
    expect(
      None()
        .orElse(() => Some(anObject))
        .unwrap(),
    ).toBe(anObject);
    expect(
      None()
        .orElse(() => None())
        .isNone(),
    ).toBe(true);
  });

  test("xor", () => {
    expect(None().xor(Some(anotherObject)).unwrap()).toBe(anotherObject);
    expect(None().xor(None()).isNone()).toBe(true);
  });

  test("zip", () => {
    expect(None().zip(Some(anotherObject)).isNone()).toBe(true);
    expect(None().zip(None()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(None().zipWith(Some(anotherObject), notCalled).isNone()).toBe(true);
  });

  test("join", () => {
    expect(None<Option<unknown>>().join().isNone()).toBe(true);
  });

  test("@iterator", () => {
    expect(Array.from(None())).toEqual([]);
  });
});
