import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constNone,
  constSome,
  fromNullable,
  isOption,
  unwrapFields,
  wrapFields,
} from "../src/index";
import {
  R,
  SameType,
  T,
  expectArgs,
  notCalled,
  theE,
  theR,
  theT,
} from "./utils";

describe("Option functions", () => {
  test("aliases", () => {
    const ok: SameType<Option.Some<T>, Some<T>> = constSome(theT);
    void ok;
    const err: SameType<Option.None<T>, None<T>> = constNone();
    void err;
    expect(Option.Some).toBe(Some);
    expect(Option.None).toBe(None);
    expect(Option.constSome).toBe(constSome);
    expect(Option.constNone).toBe(constNone);
    expect(Option.fromNullable).toBe(fromNullable);
    expect(Option.isOption).toBe(isOption);
    expect(Option.wrapFields).toBe(wrapFields);
    expect(Option.unwrapFields).toBe(unwrapFields);
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

  test("wrapFields", () => {
    type A = { a: string; b: number; c: boolean };
    expect(
      wrapFields({ a: "hello", b: 42 }) satisfies Option.WrapFields<Partial<A>>,
    ).toEqual({ a: Some("hello"), b: Some(42) });
    expect(
      wrapFields(
        { a: "hello", b: 42 },
        { a: Some(""), c: None() },
      ) satisfies Option.WrapFields<A>,
    ).toEqual({ a: Some("hello"), b: Some(42), c: None() });
  });

  test("unwrapFields", () => {
    type A = { a: string; b: number };
    expect(
      unwrapFields<A>({ a: Some("hello"), b: None() }) satisfies Partial<A>,
    ).toEqual({ a: "hello" });
    expect(
      unwrapFields<A>({ a: None(), b: Some(42) }) satisfies Partial<A>,
    ).toEqual({ b: 42 });
  });
});

describe("Option methods", () => {
  test("value", () => {
    expect(constSome(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Some(theT).value).toBe(theT);
    // @ts-expect-error
    expect(None(theT).value).toBe(undefined);
  });

  test("isSome", () => {
    expect(Some(0).isSome()).toBe(true);
    expect(None().isSome()).toBe(false);
  });

  test("isSomeAnd", () => {
    expect(Some(theT).isSomeAnd(expectArgs(true, theT))).toBe(true);
    expect(Some(theT).isSomeAnd(expectArgs(false, theT))).toBe(false);
    expect(None().isSomeAnd(notCalled)).toBe(false);
  });

  test("isNone", () => {
    expect(Some(theT).isNone()).toBe(false);
    expect(None().isNone()).toBe(true);
  });

  test("expect", () => {
    expect(Some(theT).expect("")).toBe(theT);
    expect(Some(theT).expect(notCalled)).toBe(theT);

    const error1 = Result.try(() => None().expect("xyzzy")).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect((error1 as Error).message).toBe("xyzzy");
    const error2 = Result.try(() => None().expect(() => "xyzzy")).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect((error2 as Error).message).toBe("xyzzy");
  });

  test("unwrap", () => {
    expect(Some(theT).unwrap()).toBe(theT);
    expect(Some(theT).unwrap(notCalled)).toBe(theT);
    expect(() => None().unwrap()).toThrow(Error);
    expect(() => None().unwrap(() => new Error("xyzzy"))).toThrow("xyzzy");
  });

  test("unwrapOr", () => {
    expect(Some(theT).unwrapOr(theE)).toBe(theT);
    expect(None().unwrapOr(theE)).toBe(theE);
  });

  test("unwrapOrElse", () => {
    expect(Some(theT).unwrapOrElse(notCalled)).toBe(theT);
    expect(None().unwrapOrElse(() => theR)).toBe(theR);
  });

  test("unwrapUnchecked", () => {
    expect(Some(theT).unwrapUnchecked()).toBe(theT);
    expect(None().unwrapUnchecked()).toBe(undefined);
  });

  test.each([
    ["unwrapOrUndef", (x: Option<T>) => x.unwrapOrUndef()],
    ["toNullable", (x: Option<T>) => x.toNullable()],
  ])("%s", (_name, unwrapOrUndef) => {
    expect(unwrapOrUndef(Some(theT))).toBe(theT);
    expect(unwrapOrUndef(None())).toBe(undefined);
  });

  test("okOr", () => {
    expect(Some(theT).okOr(theE).unwrap()).toBe(theT);
    expect(None().okOr(theE).unwrapErr()).toBe(theE);
  });

  test("okOrElse", () => {
    expect(Some(theT).okOrElse(notCalled).unwrap()).toBe(theT);
    expect(
      None()
        .okOrElse(expectArgs(theR))
        .unwrapErr(),
    ).toBe(theR);
    expect(
      None()
        .okOrElse(expectArgs(theR))
        .unwrapErr(),
    ).toBe(theR);
  });

  test("map", () => {
    expect(Some(theT).map(expectArgs(theR, theT)).unwrap()).toBe(theR);
    expect(None().map(notCalled).isNone()).toBe(true);
  });

  test("mapOr", () => {
    expect(Some(theT).mapOr(theE, expectArgs(theR, theT))).toBe(theR);
    expect(None().mapOr(theE, notCalled)).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(Some(theT).mapOrElse(notCalled, expectArgs(theR, theT))).toBe(theR);
    expect(None().mapOrElse(expectArgs(theR), notCalled)).toBe(theR);
  });

  test("mapOrUndef", () => {
    expect(Some(theT).mapOrUndef(expectArgs(theR, theT))).toBe(theR);
    expect(None().mapOrUndef(notCalled)).toBe(undefined);
  });

  test("mapNullable", () => {
    expect(Some(theT).mapNullable(expectArgs(theR, theT)).unwrap()).toBe(theR);
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
    expect(None().mapNullable(notCalled).isNone()).toBe(true);
  });

  test("matchSome", () => {
    const mockFunc = jest.fn(expectArgs(theR, theT));
    expect(Some(theT).matchSome(mockFunc)).toBe(undefined);
    expect(mockFunc.mock.calls.length).toBe(1);

    expect(None().matchSome(notCalled)).toBe(undefined);
  });

  test("matchNone", () => {
    expect(Some(theT).matchNone(notCalled)).toBe(undefined);

    const mockFunc = jest.fn(expectArgs(theR));
    expect(None().matchNone(mockFunc)).toBe(undefined);
    expect(mockFunc.mock.calls.length).toBe(1);
  });

  test("and", () => {
    expect(Some(theT).and(Some(theE)).unwrap()).toBe(theE);
    expect(Some(theT).and(None()).isNone()).toBe(true);
    expect(None().and(Some(theE)).isNone()).toBe(true);
    expect(None().and(None()).isNone()).toBe(true);
  });

  test("andThen/flatMap", () => {
    expect(
      Some(theT)
        .andThen(expectArgs(Some(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).andThen(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(
      Some(theT)
        .flatMap(expectArgs(Some(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).flatMap(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(None().andThen(notCalled).isNone()).toBe(true);
    expect(None().flatMap(notCalled).isNone()).toBe(true);
  });

  test("filter", () => {
    expect(Some(theT).filter(expectArgs(true, theT)).unwrap()).toBe(theT);
    expect(Some(theT).filter(expectArgs(false, theT)).isNone()).toBe(true);
    expect(None().filter(notCalled).isNone()).toBe(true);
  });

  test("or", () => {
    expect(Some(theT).or(Some(theE)).unwrap()).toBe(theT);
    expect(Some(theT).or(None()).unwrap()).toBe(theT);
    expect(None().or(Some(theE)).unwrap()).toBe(theE);
    expect(None().or(None()).isNone()).toBe(true);
  });

  test("orElse", () => {
    expect(Some(theT).orElse(notCalled).unwrap()).toBe(theT);
    expect(
      None()
        .orElse(expectArgs(Some(theT)))
        .unwrap(),
    ).toBe(theT);
    expect(None().orElse(expectArgs(None())).isNone()).toBe(true);
  });

  test("xor", () => {
    expect(Some(theT).xor(Some(theE)).isNone()).toBe(true);
    expect(Some(theT).xor(None()).unwrap()).toBe(theT);
    expect(None().xor(Some(theE)).unwrap()).toBe(theE);
    expect(None().xor(None()).isNone()).toBe(true);
  });

  test("zip", () => {
    expect(Some(theT).zip(Some(theE)).unwrap()).toEqual([theT, theE]);
    expect(Some(theT).zip(None()).isNone()).toBe(true);
    expect(None().zip(Some(theE)).isNone()).toBe(true);
    expect(None().zip(None()).isNone()).toBe(true);
  });

  test("zipWith", () => {
    expect(
      Some(theT)
        .zipWith(Some(theR), expectArgs(theR, theT, theR))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).zipWith(None(), notCalled).isNone()).toBe(true);
    expect(None().zipWith(Some(theR), notCalled).isNone()).toBe(true);
  });

  test("flatten", () => {
    expect(Some(Some(theT)).flatten().unwrap()).toBe(theT);
    expect(Some(None()).flatten().isNone()).toBe(true);
    expect(None<Option<unknown>>().flatten().isNone()).toBe(true);
  });

  test("transpose", () => {
    expect(Some(Ok(theT)).transpose().unwrap().unwrap()).toBe(theT);
    expect(Some(Err(theT)).transpose().unwrapErr()).toBe(theT);
    expect(None<Result<unknown, unknown>>().transpose().unwrap().isNone()).toBe(
      true,
    );
  });

  test("@@iterator", () => {
    expect(Array.from(Some(theT))).toEqual([theT]);
    expect(Array.from(None())).toEqual([]);
  });

  test("toString", () => {
    expect(Some(42).toString()).toBe("Some(42)");
    expect(None().toString()).toBe("None()");
  });
});
