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

describe("functions", () => {
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
    expect(
      (await Result.fromPromise(Promise.reject(theT))).unwrapErr(),
    ).toBe(theT);
  });
});

describe("Ok", () => {
  test("value", () => {
    expect(constOk(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Ok(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Err(theT).value).toBe(undefined);
  });

  test("isOk", () => {
    expect(Ok(0).isOk()).toBe(true);
  });

  test("isOkAnd", () => {
    expect(Ok(theT).isOkAnd(expectArg(theT, theT))).toBe(true);
    expect(Ok(theT).isOkAnd(expectArg(theT, theR))).toBe(false);
  });

  test("isErr", () => {
    expect(Ok(theT).isErr()).toBe(false);
  });

  test("isErrAnd", () => {
    expect(Ok(theT).isErrAnd(notCalled)).toBe(false);
  });

  test("expect", () => {
    expect(Ok(theT).expect("")).toBe(theT);
    expect(Ok(theT).expect(notCalled)).toBe(theT);
  });

  test("expectErr", () => {
    const error1: any = Result.try(() =>
      Ok(theT).expectErr("xyzzy"),
    ).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect(error1.message).toBe("xyzzy");
    const error2: any = Result.try(() =>
      Ok(theT).expectErr(() => "xyzzy"),
    ).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect(error2.message).toBe("xyzzy");
  });

  test("unwrap", () => {
    expect(Ok(theT).unwrap()).toBe(theT);
    expect(Ok(theT).unwrap(notCalled)).toBe(theT);
  });

  test("unwrapOr", () => {
    expect(Ok(theT).unwrapOr(theE)).toBe(theT);
  });

  test("unwrapOrElse", () => {
    expect(Ok(theT).unwrapOrElse(notCalled)).toBe(theT);
  });

  test("unwrapUnchecked", () => {
    expect(Ok(theT).unwrapUnchecked()).toBe(theT);
  });

  test("unwrapErr", () => {
    expect(() => Ok(theT).unwrapErr()).toThrow(Error);
    expect(() => Ok(theT).unwrapErr(() => new Error("xyzzy"))).toThrow(
      "xyzzy",
    );
  });

  test("unwrapErrUnchecked", () => {
    expect(Ok(theT).unwrapErrUnchecked()).toBe(undefined);
  });

  test("ok", () => {
    expect(Ok(theT).ok().unwrap()).toBe(theT);
  });

  test("err", () => {
    expect(Ok(theT).err().isNone()).toBe(true);
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
  });

  test("mapOr", () => {
    expect(
      Ok(theT).mapOr(0, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(
      Ok(theT).mapOrElse(notCalled, (value) => {
        expect(value).toBe(theT);
        return theE;
      }),
    ).toBe(theE);
  });

  test("mapErr", () => {
    expect(Ok(theT).mapErr(notCalled).unwrap()).toBe(theT);
  });

  test("match", () => {
    const okFunc = jest.fn(expectArg(theT, theR));

    expect(Ok(theT).match(okFunc, notCalled) satisfies R).toBe(
      theR,
    );

    expect(
      Ok(theT).match({
        Ok: okFunc,
        Err: notCalled,
      }) satisfies R,
    ).toBe(theR);

    expect(
      Ok(theT).match({
        Ok: okFunc,
      }) satisfies void,
    ).toBe(undefined);

    expect(Ok(theT).match({ Err: notCalled }) satisfies void).toBe(
      undefined,
    );

    expect(okFunc.mock.calls.length).toBe(3);
  });

  test("and", () => {
    expect(Ok(theT).and(Ok(theE)).unwrap()).toBe(theE);
    expect(Ok(theT).and(Err(theE)).unwrapErr()).toBe(
      theE,
    );
  });

  test("andThen/flatMap", () => {
    expect(
      Ok(theT)
        .andThen((value) => {
          expect(value).toBe(theT);
          return Ok(theE);
        })
        .unwrap(),
    ).toBe(theE);
    expect(
      Ok(theT)
        .andThen((value) => {
          expect(value).toBe(theT);
          return Err(theE);
        })
        .unwrapErr(),
    ).toBe(theE);
    expect(
      Ok(theT)
        .flatMap((value) => {
          expect(value).toBe(theT);
          return Ok(theE);
        })
        .unwrap(),
    ).toBe(theE);
    expect(
      Ok(theT)
        .flatMap((value) => {
          expect(value).toBe(theT);
          return Err(theE);
        })
        .unwrapErr(),
    ).toBe(theE);
  });

  test("or", () => {
    expect(Ok(theT).or(Ok(theE)).unwrap()).toBe(theT);
    expect(Ok(theT).or(Err(theE)).unwrap()).toBe(theT);
  });

  test("orElse", () => {
    expect(Ok(theT).orElse(notCalled).unwrap()).toBe(theT);
  });

  test("transpose", () => {
    expect(Ok(Some(theT)).transpose().unwrap().unwrap()).toBe(theT);
    expect(Ok(None()).transpose().isNone()).toBe(true);
  });

  test("toPromise", async () => {
    expect(await Ok(theT).toPromise()).toBe(theT);
  });

  test("toString", () => {
    expect(Ok(42).toString()).toBe("Ok(42)");
  });

  test("@iterator", () => {
    expect(Array.from(Ok(theT))).toEqual([theT]);
  });
});

describe("Err", () => {
  test("error", () => {
    expect(constErr(theT).error).toBe(theT);
    // @ts-expect-error
    expect(Err(theT).error).toBe(theT);
    // @ts-expect-error
    expect(Ok(theT).error).toBe(undefined);
  });

  test("isOk", () => {
    expect(Err(theT).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(Err(theT).isOkAnd(notCalled)).toBe(false);
  });

  test("isErr", () => {
    expect(Err(theT).isErr()).toBe(true);
  });

  test("isErrAnd", () => {
    expect(Err(theE).isErrAnd(expectArg(theE, theE))).toBe(true);
    expect(Err(theE).isErrAnd(expectArg(theE, theR))).toBe(false);
  });

  test("expect", () => {
    const error1: any = Result.try(() =>
      Err(theT).expect("xyzzy"),
    ).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect(error1.message).toBe("xyzzy");
    const error2: any = Result.try(() =>
      Err(theT).expect(() => "xyzzy"),
    ).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect(error2.message).toBe("xyzzy");
  });

  test("expectErr", () => {
    expect(Err(theT).expectErr("")).toBe(theT);
    expect(Err(theT).expectErr(notCalled)).toBe(theT);
  });

  test("unwrap", () => {
    expect(Result.try(() => Err(theT).unwrap()).unwrapErr()).toBe(theT);
    expect(
      Result.try(() => Err(theT).unwrap(() => theE)).unwrapErr(),
    ).toBe(theE);
  });

  test("unwrapOr", () => {
    expect(Err(theT).unwrapOr(theE)).toBe(theE);
  });

  test("unwrapOrElse", () => {
    expect(Err(theT).unwrapOrElse(() => theE)).toBe(theE);
  });

  test("unwrapUnchecked", () => {
    expect(Err(theT).unwrapUnchecked()).toBe(undefined);
  });

  test("unwrapErr", () => {
    expect(Err(theT).unwrapErr()).toBe(theT);
    expect(Err(theT).unwrapErr(notCalled)).toBe(theT);
  });

  test("unwrapUnchecked", () => {
    expect(Err(theT).unwrapErrUnchecked()).toBe(theT);
  });

  test("ok", () => {
    expect(Err(theT).ok().isNone()).toBe(true);
  });

  test("err", () => {
    expect(Err(theT).err().unwrap()).toBe(theT);
  });

  test("map", () => {
    expect(Err(theT).map(notCalled).unwrapErr()).toBe(theT);
  });

  test("mapOr", () => {
    expect(Err(theT).mapOr(theE, notCalled)).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(Err(theT).mapOrElse(() => theE, notCalled)).toBe(
      theE,
    );
  });

  test("mapErr", () => {
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
    const errFunc = jest.fn(expectArg(theE, theR));

    expect(Err(theE).match(notCalled, errFunc) satisfies R).toBe(theR);

    expect(
      Err(theE).match({
        Ok: notCalled,
        Err: errFunc,
      }) satisfies R,
    ).toBe(theR);

    expect(
      Err(theE).match({
        Err: errFunc,
      }) satisfies void,
    ).toBe(undefined);

    expect(Err(theE).match({ Ok: notCalled }) satisfies void).toBe(
      undefined,
    );

    expect(errFunc.mock.calls.length).toBe(3);
  });

  test("and", () => {
    expect(Err(theT).and(Ok(theE)).unwrapErr()).toBe(theT);
    expect(Err(theT).and(Err(theE)).unwrapErr()).toBe(theT);
  });

  test("andThen/flatMap", () => {
    expect(Err(theT).andThen(notCalled).unwrapErr()).toBe(theT);
    expect(Err(theT).flatMap(notCalled).unwrapErr()).toBe(theT);
  });

  test("or", () => {
    expect(Err(theT).or(Ok(theE)).unwrap()).toBe(theE);
    expect(Err(theT).or(Err(theE)).unwrapErr()).toBe(
      theE,
    );
  });

  test("orElse", () => {
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
    expect(
      Err<Option<T>, E>(theE).transpose().unwrap().unwrapErr(),
    ).toBe(theE);
  });

  test("toPromise", async () => {
    try {
      await await Err(theT).toPromise();
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe(theT);
    }
  });

  test("toString", () => {
    expect(Err(42).toString()).toBe("Err(42)");
  });

  test("@iterator", () => {
    expect(Array.from(Err(theT))).toEqual([]);
  });
});
