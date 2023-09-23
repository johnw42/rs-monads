import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  fromPromise,
  isErr,
  isOk,
  isResult,
} from "../src/index";
import {
  CallCounter,
  E,
  E2,
  SameType,
  R,
  T,
  expectArgs,
  notCalled,
  theE,
  theE2,
  theR,
  theT,
} from "./utils";

describe("Result functions", () => {
  test("aliases", () => {
    true satisfies SameType<Result.Err<T, E>, Err<T, E>>;
    true satisfies SameType<Result.Ok<T, E>, Ok<T, E>>;

    expect(Result.Err).toBe(Err);
    expect(Result.Ok).toBe(Ok);
    expect(Result.isErr).toBe(isErr);
    expect(Result.isOk).toBe(isOk);
    expect(Result.isResult).toBe(isResult);
    expect(Result.fromPromise).toBe(fromPromise);
  });

  test("Err", () => {
    let x = Err(theT);
    expect(x.isOk()).toBe(false);
    x = Ok(theT);
  });

  test("Ok", () => {
    let x = Ok(theT);
    expect(x.isOk()).toBe(true);
    x = Err(theT);
  });

  test("collect", () => {
    function* iter(yieldErr: boolean): Iterable<Result<number, E>> {
      yield Ok(1);
      yield Ok(2);
      if (yieldErr) {
        yield Err(theE);
        throw Error("should not get here");
      }
    }
    expect(Result.collect(iter(true))).toEqual(Err(theE));
    expect(Result.collect(iter(false))).toEqual(Ok([1, 2]));
  });

  test("equals", () => {
    expect(Result.equals(theT, theT)).toBe(false);
    expect(Result.equals(Some(theT), theT)).toBe(false);
    expect(Result.equals(theT, Some(theT))).toBe(false);
    testEqualsFn(Result.equals);
  });

  test("fromPromise", async () => {
    expect((await Result.fromPromise(Promise.resolve(theT))).unwrap()).toBe(
      theT,
    );
    expect((await Result.fromPromise(Promise.reject(theE))).unwrapErr()).toBe(
      theE,
    );
  });

  test("isErr", () => {
    expect(isErr(Ok(theT))).toBe(false);
    expect(isErr(Err(theE))).toBe(true);
    expect(isErr(null)).toBe(false);
    expect(isErr(undefined)).toBe(false);
    expect(isErr(theE)).toBe(false);
  });

  test("isOk", () => {
    expect(isOk(Ok(theT))).toBe(true);
    expect(isOk(Err(theE))).toBe(false);
    expect(isOk(null)).toBe(false);
    expect(isOk(undefined)).toBe(false);
    expect(isOk(theT)).toBe(false);
  });

  test("isResult", () => {
    expect(isResult(Ok(0))).toBe(true);
    expect(isResult(Err(""))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult(undefined)).toBe(false);
    expect(isResult(theT)).toBe(false);
  });

  test("try", () => {
    expect(Result.try(() => theT)).toEqual(Ok(theT));
    expect(
      Result.try(() => {
        throw theT;
      }).unwrapErr(),
    ).toBe(theT);
  });
});

describe("Result methods", () => {
  test("@@iterator", () => {
    expect(Array.from(Ok(theT))).toEqual([theT]);
    expect(Array.from(Err(theE))).toEqual([]);
  });

  test("and", () => {
    expect(Ok(theT).and(Ok(theE))).toEqual(Ok(theE));
    expect(Ok(theT).and(Err(theE))).toEqual(Err(theE));
    expect(Err(theT).and(Ok(theE))).toEqual(Err(theT));
    expect(Err(theT).and(Err(theE))).toEqual(Err(theT));
  });

  test("andThen", () => {
    expect(
      Ok(theT)
        .andThen(expectArgs(Ok(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Err(theE).andThen(notCalled)).toEqual(Err(theE));
  });

  // @copy-test flatMap
  test("flatMap", () => {
    expect(
      Ok(theT)
        .flatMap(expectArgs(Ok(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Err(theE).flatMap(notCalled)).toEqual(Err(theE));
  });

  test("error", () => {
    expect((Err<T, E>(theE) as Err<T, E>).error).toBe(theE);
    // @ts-expect-error
    expect(Err(theE).error).toBe(theE);
    // @ts-expect-error
    expect(Ok(theT).error).toBe(undefined);
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

  test("isOk", () => {
    expect(Ok(0).isOk()).toBe(true);
    expect(Err(theT).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(Ok(theT).isOkAnd(expectArgs(true, theT))).toBe(true);
    expect(Ok(theT).isOkAnd(expectArgs(false, theT))).toBe(false);
    expect(Err(theT).isOkAnd(notCalled)).toBe(false);
  });

  test("equals", () => {
    testEqualsFn((a, b, cv, ce) => a.equals(b, cv, ce));
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

  test("err", () => {
    expect(Ok(theT).err()).toEqual(None());
    expect(Err(theE).err()).toEqual(Some(theE));
  });

  test("flatten", () => {
    expect(Ok(Ok(theT)).flatten()).toEqual(Ok(theT));
    expect(Ok(Err(theE)).flatten()).toEqual(Err(theE));
    expect(Err<Result<T, E>, E2>(theE2).flatten()).toEqual(Err(theE2));
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
    expect(Err(theT).map(notCalled)).toEqual(Err(theT));
  });

  test("mapErr", () => {
    expect(Ok(theT).mapErr(notCalled)).toEqual(Ok(theT));
    expect(
      Err(theT)
        .mapErr((value) => {
          expect(value).toBe(theT);
          return theE;
        })
        .unwrapErr(),
    ).toBe(theE);
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

  test("nonNullableOr", () => {
    expect(Ok(theT).nonNullableOr(theE)).toEqual(Ok(theT));
    expect(Ok(null).nonNullableOr(theE)).toEqual(Err(theE));
    expect(Ok(undefined).nonNullableOr(theE)).toEqual(Err(theE));
    expect(Err(theE).nonNullableOr(theE2)).toEqual(Err(theE));
  });

  test("nonNullableOrElse", () => {
    expect(Ok(theT).nonNullableOrElse(expectArgs(theE))).toEqual(Ok(theT));
    expect(Ok(null).nonNullableOrElse(expectArgs(theE))).toEqual(Err(theE));
    expect(Ok(undefined).nonNullableOrElse(expectArgs(theE))).toEqual(
      Err(theE),
    );
    expect(Err(theE).nonNullableOrElse(expectArgs(theE2))).toEqual(Err(theE));
  });

  test("ok", () => {
    expect(Ok(theT).ok()).toEqual(Some(theT));
    expect(Err(theT).ok()).toEqual(None());
  });

  test("or", () => {
    expect(Ok(theT).or(Ok(theE))).toEqual(Ok(theT));
    expect(Ok(theT).or(Err(theE))).toEqual(Ok(theT));
    expect(Err(theT).or(Ok(theE))).toEqual(Ok(theE));
    expect(Err(theT).or(Err(theE))).toEqual(Err(theE));
  });

  test("orElse", () => {
    expect(Ok(theT).orElse(notCalled)).toEqual(Ok(theT));
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

  test("unwrap", () => {
    expect(Ok(theT)).toEqual(Ok(theT));
    expect(Ok(theT).unwrap(notCalled)).toBe(theT);
    expect(() => Err(Error("xyzzy")).unwrap()).toThrow("xyzzy");
    expect(() => Err(theE).unwrap(() => Error("xyzzy"))).toThrow(
      Error("xyzzy"),
    );
  });

  test("unwrapErr", () => {
    expect(() => Ok(theT).unwrapErr()).toThrow(Error);
    expect(() => Ok(theT).unwrapErr(() => new Error("xyzzy"))).toThrow("xyzzy");
    expect(Err(theT)).toEqual(Err(theT));
    expect(Err(theT).unwrapErr(notCalled)).toBe(theT);
  });

  test("unwrapOr", () => {
    expect(Ok(theT).unwrapOr(theE)).toBe(theT);
    expect(Err(theE).unwrapOr(theR)).toBe(theR);
  });

  test("unwrapOrElse", () => {
    expect(Ok(theT).unwrapOrElse(notCalled)).toBe(theT);
    expect(Err(theE).unwrapOrElse(() => theR)).toBe(theR);
  });

  test("unwrapOrUndef", () => {
    expect(Ok(theT).unwrapOrUndef()).toBe(theT);
    expect(Err(theE).unwrapOrUndef()).toBe(undefined);
  });

  // @copy-test toNullable
  test("toNullable", () => {
    expect(Ok(theT).toNullable()).toBe(theT);
    expect(Err(theE).toNullable()).toBe(undefined);
  });

  test("unwrapUnchecked", () => {
    expect(Ok(theT).unwrapUnchecked()).toBe(theT);
    expect(Err(theE).unwrapUnchecked()).toBe(undefined);
  });

  test("unwrapErrUnchecked", () => {
    expect(Ok(theT).unwrapErrUnchecked()).toBe(undefined);
    expect(Err(theT).unwrapErrUnchecked()).toBe(theT);
  });

  test("tapErr", () => {
    const ok = Ok(theT);
    expect(ok.tapErr(notCalled)).toBe(ok);

    const mockFunc = jest.fn(expectArgs(theR, theE));
    const err = Err(theE);
    expect(err.tapErr(mockFunc)).toBe(err);
    expect(mockFunc).toHaveBeenCalledTimes(1);
  });

  test("tapOk", () => {
    const mockFunc = jest.fn(expectArgs(theR, theT));
    const ok = Ok(theT);
    expect(ok.tapOk(mockFunc)).toBe(ok);
    expect(mockFunc).toHaveBeenCalledTimes(1);

    const err = Err(theE);
    expect(err.tapOk(notCalled)).toBe(err);
  });

  test("toPromise", async () => {
    expect(Ok(theT).toPromise()).resolves.toBe(theT);
    expect(Err(Error("xyzzy")).toPromise()).rejects.toThrow(Error("xyzzy"));
  });

  test("toString", () => {
    expect(Ok(42).toString()).toBe("Ok(42)");
    expect(Err(42).toString()).toBe("Err(42)");
  });

  test("transpose", () => {
    expect(Ok(Some(theT)).transpose().unwrap()).toEqual(Ok(theT));
    expect(Ok(None()).transpose().isNone()).toBe(true);
    expect(Err<Option<T>, E>(theE).transpose().unwrap()).toEqual(Err(theE));
  });

  test("value", () => {
    expect((Ok(theT) as Ok<T, E>).value).toBe(theT);
    // @ts-expect-error
    expect(Ok(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Err(theT).value).toBe(undefined);
  });

  test("withType", () => {
    (Err<T, E>(theE) as Err<T, E>).withType<R>() satisfies Result<R, E>;
  });

  test("withErrType", () => {
    (Ok<T, E>(theT) as Ok<T, E>).withErrType<E2>() satisfies Result<T, E2>;
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

describe("recipes", () => {
  test("fromNullableOr", () => {
    expect(Option.fromNullable(null).okOr(theE)).toEqual(Err(theE));
    expect(Option.fromNullable(undefined).okOr(theE)).toEqual(Err(theE));
    expect(Option.fromNullable(theT).okOr(theE)).toEqual(Ok(theT));
  });

  test("fromTruthyOr", () => {
    expect(Some("hello").filter(Boolean).okOr(theE)).toEqual(Ok("hello"));
    expect(Some(null).filter(Boolean).okOr(theE)).toEqual(Err(theE));
    expect(Some(undefined).filter(Boolean).okOr(theE)).toEqual(Err(theE));
    expect(Some(0).filter(Boolean).okOr(theE)).toEqual(Err(theE));
    expect(Some("").filter(Boolean).okOr(theE)).toEqual(Err(theE));
    expect(Some(false).filter(Boolean).okOr(theE)).toEqual(Err(theE));
  });

  const toUnwrap: Result<number, string>[] = [Ok(1), Err("2"), Ok(3), Err("4")];

  test("unwrapErrs", () => {
    expect(toUnwrap.flatMap((m) => (m.isErr() ? [m.error] : []))).toEqual([
      "2",
      "4",
    ]);
  });

  test("unwrapOks", () => {
    expect(toUnwrap.flatMap((m) => Array.from(m))).toEqual([1, 3]);
  });
});
