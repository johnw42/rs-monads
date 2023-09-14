import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constErr,
  constOk,
  fromNullableOr,
  fromNullableOrElse,
  fromResults,
  isErr,
  isOk,
  isResult,
} from "../src/index";
import {
  CallCounter,
  E,
  E2,
  R,
  SameType,
  T,
  expectArgs,
  expectType,
  notCalled,
  theE,
  theE2,
  theR,
  theT,
} from "./utils";

describe("Result functions", () => {
  test("aliases", () => {
    expectType<SameType<Result.Ok<T, E>, Ok<T, E>>>(constOk(theT));
    expectType<SameType<Result.Err<T, E>, Err<T, E>>>(constErr(theE));

    expect(Result.Ok).toBe(Ok);
    expect(Result.Err).toBe(Err);
    expect(Result.constOk).toBe(constOk);
    expect(Result.constErr).toBe(constErr);
    expect(Result.fromNullableOr).toBe(fromNullableOr);
    expect(Result.fromNullableOrElse).toBe(fromNullableOrElse);
    expect(Result.isResult).toBe(isResult);
    expect(Result.isOk).toBe(isOk);
    expect(Result.isErr).toBe(isErr);
  });

  test("try", () => {
    expect(Result.try(() => theT).unwrap()).toBe(theT);
    expect(
      Result.try(() => {
        throw theT;
      }).unwrapErr(),
    ).toBe(theT);
  });

  test("Ok", () => {
    let x = Ok(theT);
    expect(x.isOk()).toBe(true);
    x = Err(theT);
  });

  test("Err", () => {
    let x = Err(theT);
    expect(x.isOk()).toBe(false);
    x = Ok(theT);
  });

  test("constOk", () => {
    const x: Ok<T, E> = constOk(theT);
    expect(x.isOk()).toBe(true);
  });

  test("constErr", () => {
    const x: Err<T, E> = constErr(theE);
    expect(x.isOk()).toBe(false);
  });

  test("isResult", () => {
    expect(isResult(Ok(0))).toBe(true);
    expect(isResult(Err(""))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult(undefined)).toBe(false);
    expect(isResult(theT)).toBe(false);
  });

  test("isOk", () => {
    expect(isOk(Ok(theT))).toBe(true);
    expect(isOk(Err(theE))).toBe(false);
    expect(isOk(null)).toBe(false);
    expect(isOk(undefined)).toBe(false);
    expect(isOk(theT)).toBe(false);
  });

  test("isErr", () => {
    expect(isErr(Ok(theT))).toBe(false);
    expect(isErr(Err(theE))).toBe(true);
    expect(isErr(null)).toBe(false);
    expect(isErr(undefined)).toBe(false);
    expect(isErr(theE)).toBe(false);
  });

  test("Result.equals", () => {
    expect(Result.equals(theT, theT)).toBe(false);
    expect(Result.equals(Some(theT), theT)).toBe(false);
    expect(Result.equals(theT, Some(theT))).toBe(false);
    testEqualsFn(Result.equals);
  });

  test("fromNullableOr", () => {
    expect(fromNullableOr(theE, null).unwrapErr()).toBe(theE);
    expect(fromNullableOr(theE, undefined).unwrapErr()).toBe(theE);
    expect(fromNullableOr(theE, theT).unwrap()).toBe(theT);
  });

  test("fromNullableOrElse", () => {
    expect(fromNullableOrElse(expectArgs(theE), null).unwrapErr()).toBe(theE);
    expect(fromNullableOrElse(expectArgs(theE), undefined).unwrapErr()).toBe(
      theE,
    );
    expect(fromNullableOrElse(notCalled, theT).unwrap()).toBe(theT);
  });

  test("fromPromise", async () => {
    expect((await Result.fromPromise(Promise.resolve(theT))).unwrap()).toBe(
      theT,
    );
    expect((await Result.fromPromise(Promise.reject(theE))).unwrapErr()).toBe(
      theE,
    );
  });

  test("fromResults", () => {
    function* iter(yieldErr: boolean) {
      yield Ok(1);
      yield Ok(2);
      if (yieldErr) {
        yield Err(theE);
        throw Error("should not get here");
      }
    }
    expect(fromResults(iter(true))).toEqual(Err(theE));
    expect(fromResults(iter(false))).toEqual(Ok([1, 2]));
  });
});

describe("Result methods", () => {
  test("value", () => {
    expect(constOk(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Ok(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Err(theT).value).toBe(undefined);
  });

  test("error", () => {
    expect(constErr(theT).error).toBe(theT);
    // @ts-expect-error
    expect(Err(theT).error).toBe(theT);
    // @ts-expect-error
    expect(Ok(theT).error).toBe(undefined);
  });

  test("withType", () => {
    expectType<Result<R, E>>(constErr<T, E>(theE).withType<R>());
  });

  test("withErrType", () => {
    expectType<Result<T, E2>>(constOk<T, E>(theT).withErrType<E2>());
  });

  test("isOk", () => {
    expect(Ok(0).isOk()).toBe(true);
    expect(Err(theT).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(Ok(theT).isOkAnd(expectArgs(true, theT))).toBe(true);
    expect(Ok(theT).isOkAnd(expectArgs(false, theT))).toBe(false);
    expect(Err(theT).isOkAnd(notCalled)).toBe(false);
  });

  test("isErr", () => {
    expect(Ok(theT).isErr()).toBe(false);
    expect(Err(theT).isErr()).toBe(true);
  });

  test("isErrAnd", () => {
    expect(Ok(theT).isErrAnd(notCalled)).toBe(false);
    expect(Err(theE).isErrAnd(expectArgs(true, theE))).toBe(true);
    expect(Err(theE).isErrAnd(expectArgs(false, theE))).toBe(false);
  });

  test("expect", () => {
    expect(Ok(theT).expect("")).toBe(theT);
    expect(Ok(theT).expect(notCalled)).toBe(theT);
    expect(() => Err(theT).expect("xyzzy")).toThrow(Error("xyzzy"));
    expect(() => Err(theT).expect(() => "xyzzy")).toThrow(Error("xyzzy"));
  });

  test("expectErr", () => {
    expect(() => Ok(theT).expectErr("xyzzy")).toThrow(Error("xyzzy"));
    expect(() => Ok(theT).expectErr(() => "xyzzy")).toThrow(Error("xyzzy"));
    expect(Err(theE).expectErr("")).toBe(theE);
    expect(Err(theE).expectErr(notCalled)).toBe(theE);
  });

  test("unwrap", () => {
    expect(Ok(theT).unwrap()).toBe(theT);
    expect(Ok(theT).unwrap(notCalled)).toBe(theT);
    expect(() => Err(Error("xyzzy")).unwrap()).toThrow("xyzzy");
    expect(() => Err(theE).unwrap(() => Error("xyzzy"))).toThrow(
      Error("xyzzy"),
    );
  });

  test("unwrapOr", () => {
    expect(Ok(theT).unwrapOr(theE)).toBe(theT);
    expect(Err(theE).unwrapOr(theR)).toBe(theR);
  });

  test("unwrapOrElse", () => {
    expect(Ok(theT).unwrapOrElse(notCalled)).toBe(theT);
    expect(Err(theE).unwrapOrElse(() => theR)).toBe(theR);
  });

  test("unwrapUnchecked", () => {
    expect(Ok(theT).unwrapUnchecked()).toBe(theT);
    expect(Err(theE).unwrapUnchecked()).toBe(undefined);
  });

  test.each([
    ["unwrapOrUndef", (x: Result<T, E>) => x.unwrapOrUndef()],
    ["toNullable", (x: Result<T, E>) => x.toNullable()],
  ])("%s", (_name, unwrapOrUndef) => {
    expect(unwrapOrUndef(Ok(theT))).toBe(theT);
    expect(unwrapOrUndef(Err(theE))).toBe(undefined);
  });

  test("unwrapErr", () => {
    expect(() => Ok(theT).unwrapErr()).toThrow(Error);
    expect(() => Ok(theT).unwrapErr(() => new Error("xyzzy"))).toThrow("xyzzy");
    expect(Err(theT).unwrapErr()).toBe(theT);
    expect(Err(theT).unwrapErr(notCalled)).toBe(theT);
  });

  test("unwrapErrUnchecked", () => {
    expect(Ok(theT).unwrapErrUnchecked()).toBe(undefined);
    expect(Err(theT).unwrapErrUnchecked()).toBe(theT);
  });

  test("ok", () => {
    expect(Ok(theT).ok().unwrap()).toBe(theT);
    expect(Err(theT).ok().isNone()).toBe(true);
  });

  test("err", () => {
    expect(Ok(theT).err().isNone()).toBe(true);
    expect(Err(theT).err().unwrap()).toBe(theT);
  });

  test("map", () => {
    expect(
      Ok(theT)
        .map((value) => {
          expect(value).toBe(theT);
          return theE;
        })
        .unwrap(),
    ).toBe(theE);
    expect(Err(theT).map(notCalled).unwrapErr()).toBe(theT);
  });

  test("mapOr", () => {
    expect(Ok(theT).mapOr(theE, expectArgs(theR, theT))).toBe(theR);
    expect(Err(theE).mapOr(theR, notCalled)).toBe(theR);
  });

  test("mapOrElse", () => {
    expect(
      Ok(theT).mapOrElse(notCalled, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
    expect(Err(theT).mapOrElse(() => theE, notCalled)).toBe(theE);
  });

  test("mapOrUndef", () => {
    expect(Ok(theT).mapOrUndef(expectArgs(theR, theT))).toBe(theR);
    expect(Err(theE).mapOrUndef(notCalled)).toBe(undefined);
  });

  test("mapNullableOr", () => {
    const defaultE = {};
    expect(
      Ok(theT).mapNullableOr(defaultE, expectArgs(theR, theT)).unwrap(),
    ).toBe(theR);
    expect(
      Ok(theT)
        .mapNullableOr(defaultE, () => null)
        .unwrapErr(),
    ).toBe(defaultE);
    expect(
      Ok(theT)
        .mapNullableOr(defaultE, () => undefined)
        .unwrapErr(),
    ).toBe(defaultE);
    expect(Err(theE).mapNullableOr(defaultE, notCalled).unwrapErr()).toBe(theE);
  });

  test("mapNullableOrElse", () => {
    const defaultE = {};
    expect(
      Ok(theT).mapNullableOrElse(notCalled, expectArgs(theR, theT)).unwrap(),
    ).toBe(theR);
    expect(
      Ok(theT)
        .mapNullableOrElse(expectArgs(defaultE), () => null)
        .unwrapErr(),
    ).toBe(defaultE);
    expect(
      Ok(theT)
        .mapNullableOrElse(expectArgs(defaultE), () => undefined)
        .unwrapErr(),
    ).toBe(defaultE);
    expect(Err(theE).mapNullableOrElse(notCalled, notCalled).unwrapErr()).toBe(
      theE,
    );
  });

  test("mapErr", () => {
    expect(Ok(theT).mapErr(notCalled).unwrap()).toBe(theT);
    expect(
      Err(theT)
        .mapErr((value) => {
          expect(value).toBe(theT);
          return theE;
        })
        .unwrapErr(),
    ).toBe(theE);
  });

  test("tapOk", () => {
    const mockFunc = jest.fn(expectArgs(theR, theT));
    const ok = Ok(theT);
    expect(ok.tapOk(mockFunc)).toBe(ok);
    expect(mockFunc).toHaveBeenCalledTimes(1);

    const err = Err(theE);
    expect(err.tapOk(notCalled)).toBe(err);
  });

  test("tapErr", () => {
    const ok = Ok(theT);
    expect(ok.tapErr(notCalled)).toBe(ok);

    const mockFunc = jest.fn(expectArgs(theR, theE));
    const err = Err(theE);
    expect(err.tapErr(mockFunc)).toBe(err);
    expect(mockFunc).toHaveBeenCalledTimes(1);
  });

  test("and", () => {
    expect(Ok(theT).and(Ok(theE)).unwrap()).toBe(theE);
    expect(Ok(theT).and(Err(theE)).unwrapErr()).toBe(theE);
    expect(Err(theT).and(Ok(theE)).unwrapErr()).toBe(theT);
    expect(Err(theT).and(Err(theE)).unwrapErr()).toBe(theT);
  });

  test.each([
    ["andThen", (x: Result<T, E>, f: (arg: T) => Result<R, E>) => x.andThen(f)],
    ["flatMap", (x: Result<T, E>, f: (arg: T) => Result<R, E>) => x.flatMap(f)],
  ])("%s", (_name, andThen) => {
    expect(andThen(Ok(theT), expectArgs(Ok(theR), theT)).unwrap()).toBe(theR);
    expect(andThen(Err(theE), notCalled).unwrapErr()).toBe(theE);
  });

  test("or", () => {
    expect(Ok(theT).or(Ok(theE)).unwrap()).toBe(theT);
    expect(Ok(theT).or(Err(theE)).unwrap()).toBe(theT);
    expect(Err(theT).or(Ok(theE)).unwrap()).toBe(theE);
    expect(Err(theT).or(Err(theE)).unwrapErr()).toBe(theE);
  });

  test("orElse", () => {
    expect(Ok(theT).orElse(notCalled).unwrap()).toBe(theT);
    expect(
      Err(theT)
        .orElse(() => Ok(theE))
        .unwrap(),
    ).toBe(theE);
    expect(
      Err(theT)
        .orElse(() => Err(theE))
        .unwrapErr(),
    ).toBe(theE);
  });

  test.each([
    ["flatten", (x: Result<Result<T, E>, E2>) => x.flatten()],
    ["join", (x: Result<Result<T, E>, E2>) => x.join()],
  ])("%s", (_name, flatten) => {
    expect(flatten(Ok(Ok(theT)))).toEqual(Ok(theT));
    expect(flatten(Ok(Err(theE)))).toEqual(Err(theE));
    expect(flatten(Err<Result<T, E>, E2>(theE2))).toEqual(Err(theE2));
  });

  test("transpose", () => {
    expect(Ok(Some(theT)).transpose().unwrap().unwrap()).toBe(theT);
    expect(Ok(None()).transpose().isNone()).toBe(true);
    expect(Err<Option<T>, E>(theE).transpose().unwrap().unwrapErr()).toBe(theE);
  });

  test("toPromise", async () => {
    expect(Ok(theT).toPromise()).resolves.toBe(theT);
    expect(Err(Error("xyzzy")).toPromise()).rejects.toThrow(Error("xyzzy"));
  });

  test("toString", () => {
    expect(Ok(42).toString()).toBe("Ok(42)");
    expect(Err(42).toString()).toBe("Err(42)");
  });

  test("equals", () => {
    testEqualsFn((a, b, cv, ce) => a.equals(b, cv, ce));
  });

  test("@@iterator", () => {
    expect(Array.from(Ok(theT))).toEqual([theT]);
    expect(Array.from(Err(theE))).toEqual([]);
  });
});

function testEqualsFn(
  eq: (
    a: Result<unknown, unknown>,
    b: Result<unknown, unknown>,
    cmpOk?: (aValue: unknown, bValue: unknown) => boolean,
    cmpErr?: (aValue: unknown, bValue: unknown) => boolean,
  ) => boolean,
): void {
  expect(eq(Ok(theT), Ok(theT))).toBe(true);
  expect(eq(Ok(theT), Ok(theE))).toBe(false);
  expect(eq(Ok(theT), Err(theE))).toBe(false);
  expect(eq(Err(theE), Ok(theT))).toBe(false);
  expect(eq(Err(theE), Err(theE))).toBe(true);
  expect(eq(Err(theT), Err(theE))).toBe(false);

  expect(eq(Ok(Ok(theT)), Ok(Ok(theT)))).toBe(true);
  expect(eq(Ok(Ok(theT)), Ok(Ok(theE)))).toBe(false);
  expect(eq(Ok(Ok(theT)), Ok(Err(theE)))).toBe(false);
  expect(eq(Err(Ok(theE)), Ok(Err(theE)))).toBe(false);
  expect(eq(Err(Err(theE)), Err(Err(theE)))).toBe(true);

  for (const innerEqual of [true, false]) {
    for (const [left, right] of [
      [theT, theT],
      [theT, theE],
      [Ok(theT), Ok(theT)],
      [Ok(theT), Ok(theE)],
    ]) {
      const counter = new CallCounter();
      expect(
        eq(
          Ok(left),
          Ok(right),
          counter.expectArgs(innerEqual, left, right),
          notCalled,
        ),
      ).toBe(innerEqual);
      expect(
        eq(
          Err(left),
          Err(right),
          notCalled,
          counter.expectArgs(innerEqual, left, right),
        ),
      ).toBe(innerEqual);
      expect(counter.count).toBe(2);
    }
  }
  expect(eq(Ok(theT), Err(theE), notCalled)).toBe(false);
  expect(eq(Err(theE), Ok(theT), notCalled)).toBe(false);
}
