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
  R,
  SameType,
  T,
  expectArg,
  notCalled,
  theE,
  theR,
  theT,
} from "./utils";

describe("functions", () => {
  test("aliases", () => {
    const ok: SameType<Option.Some<T>, Some<T>> = constSome(theT);
    void ok;
    const err: SameType<Option.None<T>, None<T>> = constNone();
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
    expect(isOption(theT)).toBe(false);
  });
});

describe("Some", () => {
  test("value", () => {
    expect(constSome(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Some(theT).value).toBe(theT);
    // @ts-expect-error
    expect(None(theT).value).toBe(undefined);
  });

  test("isSome", () => {
    expect(Some(0).isSome()).toBe(true);
  });

  test("isSomeAnd", () => {
    expect(Some(theT).isSomeAnd(expectArg(theT, true))).toBe(true);
    expect(Some(theT).isSomeAnd(expectArg(theT, false))).toBe(false);
  });

  test("isNone", () => {
    expect(Some(theT).isNone()).toBe(false);
  });

  test("expect", () => {
    expect(Some(theT).expect("")).toBe(theT);
    expect(Some(theT).expect(notCalled)).toBe(theT);
  });

  test("unwrap", () => {
    expect(Some(theT).unwrap()).toBe(theT);
    expect(Some(theT).unwrap(notCalled)).toBe(theT);
  });

  test("unwrapOr", () => {
    expect(Some(theT).unwrapOr(theE)).toBe(theT);
  });

  test("unwrapOrElse", () => {
    expect(Some(theT).unwrapOrElse(notCalled)).toBe(theT);
  });

  test("unwrapUnchecked", () => {
    expect(Some(theT).unwrapUnchecked()).toBe(theT);
  });

  test("toNullable", () => {
    expect(Some(theT).toNullable()).toBe(theT);
  });

  test("okOr", () => {
    expect(Some(theT).okOr(theE).unwrap()).toBe(theT);
  });

  test("okOrElse", () => {
    expect(Some(theT).okOrElse(notCalled).unwrap()).toBe(theT);
  });

  test("map", () => {
    expect(
      Some(theT)
        .map((value) => {
          expect(value).toBe(theT);
          return theE;
        })
        .unwrap(),
    ).toBe(theE);
  });

  test("mapOr", () => {
    expect(
      Some(theT).mapOr(0, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(
      Some(theT).mapOrElse(notCalled, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
  });

  test("mapOpt", () => {
    expect(
      Some(theT)
        .mapNullable((value) => {
          expect(value).toBe(theT);
          return theE;
        })
        .unwrap(),
    ).toBe(theE);
    expect(
      Some(theT)
        .mapNullable(() => null)
        .isNone(),
    ).toBe(true);
    expect(
      Some(theT)
        .mapNullable(() => undefined)
        .isNone(),
    ).toBe(true);
  });

  test("match", () => {
    const someFunc = jest.fn(expectArg(theT, theR));

    expect(Some(theT).match(someFunc, notCalled) satisfies R).toBe(theR);

    expect(
      Some(theT).match({
        Some: someFunc,
        None: notCalled,
      }) satisfies R,
    ).toBe(theR);

    expect(
      Some(theT).match({
        Some: someFunc,
      }) satisfies void,
    ).toBe(undefined);

    expect(Some(theT).match({ None: notCalled }) satisfies void).toBe(
      undefined,
    );

    expect(someFunc.mock.calls.length).toBe(3);
  });

  test("and", () => {
    expect(Some(theT).and(Some(theE)).unwrap()).toBe(theE);
    expect(Some(theT).and(None()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(
      Some(theT)
        .andThen(expectArg(theT, Some(theE)))
        .unwrap(),
    ).toBe(theE);
    expect(Some(theT).andThen(expectArg(theT, None())).isNone()).toBe(true);
    expect(
      Some(theT)
        .flatMap(expectArg(theT, Some(theE)))
        .unwrap(),
    ).toBe(theE);
    expect(
      Some(theT)
        .flatMap((value) => {
          expect(value).toBe(theT);
          return None();
        })
        .isNone(),
    ).toBe(true);
  });

  test("filter", () => {
    expect(Some(theT).filter(expectArg(theT, true)).unwrap()).toBe(theT);
    expect(Some(theT).filter(expectArg(theT, false)).isNone()).toBe(true);
  });

  test("or", () => {
    expect(Some(theT).or(Some(theE)).unwrap()).toBe(theT);
    expect(Some(theT).or(None()).unwrap()).toBe(theT);
  });

  test("orElse", () => {
    expect(Some(theT).orElse(notCalled).unwrap()).toBe(theT);
  });

  test("xor", () => {
    expect(Some(theT).xor(Some(theE)).isNone()).toBe(true);
    expect(Some(theT).xor(None()).unwrap()).toBe(theT);
  });

  test("zip", () => {
    expect(Some(theT).zip(Some(theE)).unwrap()).toEqual([theT, theE]);
    expect(Some(theT).zip(None()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(
      Some(theT)
        .zipWith(Some(theE), (a, b) => {
          expect(a).toBe(theT);
          expect(b).toBe(theE);
          return theR;
        })
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).zipWith(None(), notCalled).isNone()).toBe(true);
  });

  test("flatten", () => {
    expect(Some(Some(theT)).flatten().unwrap()).toBe(theT);
    expect(Some(None()).flatten().isNone()).toBe(true);
  });

  test("transpose", () => {
    expect(Some(Ok(theT)).transpose().unwrap().unwrap()).toBe(theT);
    expect(Some(Err(theT)).transpose().unwrapErr()).toBe(theT);
  });

  test("@iterator", () => {
    expect(Array.from(Some(theT))).toEqual([theT]);
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
    expect(None().unwrapOr(theE)).toBe(theE);
  });

  test("unwrapOrElse", () => {
    expect(None().unwrapOrElse(() => theE)).toBe(theE);
  });

  test("unwrapUnchecked", () => {
    expect(None().unwrapUnchecked()).toBe(undefined);
  });

  test("toNullable", () => {
    expect(None().toNullable()).toBe(undefined);
  });

  test("okOr", () => {
    expect(None().okOr(theE).unwrapErr()).toBe(theE);
  });

  test("okOrElse", () => {
    expect(
      None()
        .okOrElse(() => theE)
        .unwrapErr(),
    ).toBe(theE);
  });

  test("map", () => {
    expect(None().map(notCalled).isNone()).toBe(true);
  });

  test("mapOr", () => {
    expect(None().mapOr(theE, notCalled)).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(None().mapOrElse(() => theE, notCalled)).toBe(theE);
  });

  test("mapOpt", () => {
    expect(None().mapNullable(notCalled).isNone()).toBe(true);
  });

  test("match", () => {
    const noneFunc = jest.fn(() => theR);

    expect(None().match(notCalled, noneFunc) satisfies R).toBe(theR);

    expect(
      None().match({
        Some: notCalled,
        None: noneFunc,
      }) satisfies R,
    ).toBe(theR);

    expect(
      None().match({
        Some: notCalled,
      }) satisfies void,
    ).toBe(undefined);

    expect(None().match({ None: noneFunc }) satisfies void).toBe(undefined);

    expect(noneFunc.mock.calls.length).toBe(3);
  });

  test("and", () => {
    expect(None().and(Some(theE)).isNone()).toBe(true);
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
    expect(None().or(Some(theE)).unwrap()).toBe(theE);
    expect(None().or(None()).isNone()).toBe(true);
  });

  test("orElse", () => {
    expect(
      None()
        .orElse(() => Some(theT))
        .unwrap(),
    ).toBe(theT);
    expect(
      None()
        .orElse(() => None())
        .isNone(),
    ).toBe(true);
  });

  test("xor", () => {
    expect(None().xor(Some(theE)).unwrap()).toBe(theE);
    expect(None().xor(None()).isNone()).toBe(true);
  });

  test("zip", () => {
    expect(None().zip(Some(theE)).isNone()).toBe(true);
    expect(None().zip(None()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(None().zipWith(Some(theE), notCalled).isNone()).toBe(true);
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
