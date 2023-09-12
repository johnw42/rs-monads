import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constNone,
  constSome,
  isOption,
} from "../src/index";
import {
  SameType,
  anObject,
  anotherObject,
  isZero,
  notCalled,
  thirdObject,
  T,
  expectArg,
  R,
} from "./utils";

describe("functions", () => {
  test("aliases", () => {
    const ok: SameType<Option.Some<T>, Some<T>> = constSome(anObject);
    const err: SameType<Option.None<T>, None<T>> = constNone();
    void ok;
    void err;
    expect(Option.Some).toBe(Some);
    expect(Option.None).toBe(None);
    expect(Option.constSome).toBe(constSome);
    expect(Option.constNone).toBe(constNone);
    expect(Option.isOption).toBe(isOption);
  });

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

  test("unwrapUnchecked", () => {
    expect(Some(anObject).unwrapUnchecked()).toBe(anObject);
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
    const someFunc = jest.fn(expectArg(anObject, thirdObject));

    expect(Some(anObject).match(someFunc, notCalled) satisfies R).toBe(
      thirdObject,
    );

    expect(
      Some(anObject).match({
        Some: someFunc,
        None: notCalled,
      }) satisfies R,
    ).toBe(thirdObject);

    expect(
      Some(anObject).match({
        Some: someFunc,
      }) satisfies void,
    ).toBe(undefined);

    expect(Some(anObject).match({ None: notCalled }) satisfies void).toBe(
      undefined,
    );

    expect(someFunc.mock.calls.length).toBe(3);
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
        .andThen(expectArg(anObject, Some(anotherObject)))
        .unwrap(),
    ).toBe(anotherObject);
    expect(Some(anObject).andThen(expectArg(anObject, None())).isNone()).toBe(
      true,
    );
    expect(
      Some(anObject)
        .flatMap(expectArg(anObject, Some(anotherObject)))
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
    expect(Some(anObject).filter(expectArg(anObject, true)).unwrap()).toBe(
      anObject,
    );
    expect(Some(anObject).filter(expectArg(anObject, false)).isNone()).toBe(
      true,
    );
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

  test("flatten", () => {
    expect(Some(Some(anObject)).flatten().unwrap()).toBe(anObject);
    expect(Some(None()).flatten().isNone()).toBe(true);
  });

  test("transpose", () => {
    expect(Some(Ok(anObject)).transpose().unwrap().unwrap()).toBe(anObject);
    expect(Some(Err(anObject)).transpose().unwrapErr()).toBe(anObject);
  });

  test("@iterator", () => {
    expect(Array.from(Some(anObject))).toEqual([anObject]);
  });

  test("toString", () => {
    expect(Some(42).toString()).toBe("Some(42)");
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
    const error1 = Result.try(() => None().expect("xyzzy")).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect((error1 as Error).message).toBe("xyzzy");
    const error2 = Result.try(() => None().expect(() => "xyzzy")).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect((error2 as Error).message).toBe("xyzzy");
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

  test("unwrapUnchecked", () => {
    expect(None().unwrapUnchecked()).toBe(undefined);
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
    const noneFunc = jest.fn(() => thirdObject);

    expect(None().match(notCalled, noneFunc) satisfies R).toBe(thirdObject);

    expect(
      None().match({
        Some: notCalled,
        None: noneFunc,
      }) satisfies R,
    ).toBe(thirdObject);

    expect(
      None().match({
        Some: notCalled,
      }) satisfies void,
    ).toBe(undefined);

    expect(None().match({ None: noneFunc }) satisfies void).toBe(undefined);

    expect(noneFunc.mock.calls.length).toBe(3);
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

  test("flatten", () => {
    expect(None<Option<unknown>>().flatten().isNone()).toBe(true);
  });

  test("transpose", () => {
    expect(None<Result<unknown, unknown>>().transpose().unwrap().isNone()).toBe(
      true,
    );
  });

  test("@iterator", () => {
    expect(Array.from(None())).toEqual([]);
  });

  test("toString", () => {
    expect(None().toString()).toBe("None()");
  });
});
