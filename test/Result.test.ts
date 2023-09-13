import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constErr,
  constOk,
  isResult,
} from "../src/index";
import {
  E,
  R,
  SameType,
  T,
  expectArg,
  notCalled,
  theE,
  theR,
  theT,
} from "./utils";

describe("Result functions", () => {
  test("aliases", () => {
    const ok: SameType<Result.Ok<T, E>, Ok<T, E>> = constOk(theT);
    const err: SameType<Result.Err<T, E>, Err<T, E>> = constErr(theE);
    void ok;
    void err;
    expect(Result.Ok).toBe(Ok);
    expect(Result.Err).toBe(Err);
    expect(Result.constOk).toBe(constOk);
    expect(Result.constErr).toBe(constErr);
    expect(Result.isResult).toBe(isResult);
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

  test("isOption", () => {
    expect(isResult(Ok(0))).toBe(true);
    expect(isResult(Err(""))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult(undefined)).toBe(false);
    expect(isResult(theT)).toBe(false);
  });

  test("fromPromise", async () => {
    expect((await Result.fromPromise(Promise.resolve(theT))).unwrap()).toBe(
      theT,
    );
    expect((await Result.fromPromise(Promise.reject(theE))).unwrapErr()).toBe(
      theE,
    );
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

  test("isOk", () => {
    expect(Ok(0).isOk()).toBe(true);
    expect(Err(theT).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(Ok(theT).isOkAnd(expectArg(theT, true))).toBe(true);
    expect(Ok(theT).isOkAnd(expectArg(theT, false))).toBe(false);
    expect(Err(theT).isOkAnd(notCalled)).toBe(false);
  });

  test("isErr", () => {
    expect(Ok(theT).isErr()).toBe(false);
    expect(Err(theT).isErr()).toBe(true);
  });

  test("isErrAnd", () => {
    expect(Ok(theT).isErrAnd(notCalled)).toBe(false);
    expect(Err(theE).isErrAnd(expectArg(theE, true))).toBe(true);
    expect(Err(theE).isErrAnd(expectArg(theE, false))).toBe(false);
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
    expect(Err(theT).unwrapOr(theE)).toBe(theE);
  });

  test("unwrapOrElse", () => {
    expect(Ok(theT).unwrapOrElse(notCalled)).toBe(theT);
    expect(Err(theT).unwrapOrElse(() => theE)).toBe(theE);
  });

  test("unwrapUnchecked", () => {
    expect(Ok(theT).unwrapUnchecked()).toBe(theT);
    expect(Err(theT).unwrapUnchecked()).toBe(undefined);
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
    expect(
      Ok(theT).mapOr(0, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
    expect(Err(theT).mapOr(theE, notCalled)).toBe(theE);
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

  test("match", () => {
    const okFunc = jest.fn(expectArg(theT, theR));
    const errFunc = jest.fn(expectArg(theE, theR));

    expect(Ok(theT).match(okFunc, notCalled) satisfies R).toBe(theR);
    expect(Err(theE).match(notCalled, errFunc) satisfies R).toBe(theR);

    expect(
      Ok(theT).match({
        Ok: okFunc,
        Err: notCalled,
      }) satisfies R,
    ).toBe(theR);
    expect(
      Err(theE).match({
        Ok: notCalled,
        Err: errFunc,
      }) satisfies R,
    ).toBe(theR);

    expect(
      Ok(theT).match({
        Ok: okFunc,
      }) satisfies void,
    ).toBe(undefined);
    expect(
      Err(theE).match({
        Err: errFunc,
      }) satisfies void,
    ).toBe(undefined);

    expect(Ok(theT).match({ Err: notCalled }) satisfies void).toBe(undefined);
    expect(Err(theE).match({ Ok: notCalled }) satisfies void).toBe(undefined);

    expect(okFunc.mock.calls.length).toBe(3);
    expect(errFunc.mock.calls.length).toBe(3);
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
    expect(andThen(Ok(theT), expectArg(theT, Ok(theR))).unwrap()).toBe(theR);
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

  test("@@iterator", () => {
    expect(Array.from(Ok(theT))).toEqual([theT]);
    expect(Array.from(Err(theE))).toEqual([]);
  });
});
