import { None, Option, Some } from "../src/Option";
import { Result, isResult, Err, Ok, constOk, constErr } from "../src/Result";

const anObject = { a: 0 };
const anotherObject = { b: 1 };

type T = typeof anObject;
type E = typeof anotherObject;

function notCalled(...args: any[]): never {
  throw Error("Called notCalled");
}

function isZero(n: number): boolean {
  return n === 0;
}

describe("functions", () => {
  test("try", () => {
    expect(Result.try(() => anObject).unwrap()).toBe(anObject);
    expect(
      Result.try(() => {
        throw anObject;
      }).unwrapErr(),
    ).toBe(anObject);
  });

  test("Ok", () => {
    expect(Ok(0).isOk()).toBe(true);
  });

  test("Err", () => {
    expect(Err(anObject).isOk()).toBe(false);
  });

  test("constOk", () => {
    expect(constOk(0).isOk()).toBe(true);
  });

  test("constErr", () => {
    expect(constErr(anObject).isOk()).toBe(false);
  });

  test("isOption", () => {
    expect(isResult(Ok(0))).toBe(true);
    expect(isResult(Err(""))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult(undefined)).toBe(false);
    expect(isResult(anObject)).toBe(false);
  });

  test("fromPromise", async () => {
    expect((await Result.fromPromise(Promise.resolve(anObject))).unwrap()).toBe(
      anObject,
    );
    expect(
      (await Result.fromPromise(Promise.reject(anObject))).unwrapErr(),
    ).toBe(anObject);
  });
});

describe("Ok", () => {
  test("value", () => {
    expect(constOk(anObject).value).toBe(anObject);
    // @ts-expect-error
    expect(Ok(anObject).value).toBe(anObject);
    // @ts-expect-error
    expect(Err(anObject).value).toBe(undefined);
  });

  test("isOk", () => {
    expect(Ok(0).isOk()).toBe(true);
  });

  test("isOkAnd", () => {
    expect(Ok(0).isOkAnd(isZero)).toBe(true);
    expect(Ok(1).isOkAnd(isZero)).toBe(false);
  });

  test("isErr", () => {
    expect(Ok(0).isErr()).toBe(false);
  });

  test("isErrAnd", () => {
    expect(Ok(0).isErrAnd(notCalled)).toBe(false);
  });

  test("expect", () => {
    expect(Ok(anObject).expect("")).toBe(anObject);
    expect(Ok(anObject).expect(notCalled)).toBe(anObject);
  });

  test("expectErr", () => {
    const error1: any = Result.try(() => Ok(anObject).expectErr("xyzzy")).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect(error1.message).toBe("xyzzy");
    const error2: any = Result.try(() => Ok(anObject).expectErr(() => "xyzzy")).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect(error2.message).toBe("xyzzy");
  });

  test("unwrap", () => {
    expect(Ok(anObject).unwrap()).toBe(anObject);
    expect(Ok(anObject).unwrap(notCalled)).toBe(anObject);
  });

  test("unwrapOr", () => {
    expect(Ok(anObject).unwrapOr(anotherObject)).toBe(anObject);
  });

  test("unwrapOrElse", () => {
    expect(Ok(anObject).unwrapOrElse(notCalled)).toBe(anObject);
  });

  test("unwrapUnchecked", () => {
    expect(Ok(anObject).unwrapUnchecked()).toBe(anObject);
  });

  test("unwrapErr", () => {
    expect(() => Ok(anObject).unwrapErr()).toThrow(Error);
    expect(() => Ok(anObject).unwrapErr(() => new Error("xyzzy"))).toThrow(
      "xyzzy",
    );
  });

  test("unwrapErrUnchecked", () => {
    expect(Ok(anObject).unwrapErrUnchecked()).toBe(undefined);
  });

  test("ok", () => {
    expect(Ok(anObject).ok().unwrap()).toBe(anObject);
  });

  test("err", () => {
    expect(Ok(anObject).err().isNone()).toBe(true);
  });

  test("map", () => {
    expect(
      Ok(anObject)
        .map((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
    ).toBe(anotherObject);
  });

  test("mapOr", () => {
    expect(
      Ok(anObject).mapOr(0, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(
      Ok(anObject).mapOrElse(notCalled, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapErr", () => {
    expect(Ok(anObject).mapErr(notCalled).unwrap()).toBe(anObject);
  });

  test("match", () => {
    expect(
      Ok(anObject).match((value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }, notCalled),
    ).toBe(anotherObject);
  });

  test("and", () => {
    expect(Ok(anObject).and(Ok(anotherObject)).unwrap()).toBe(anotherObject);
    expect(Ok(anObject).and(Err(anotherObject)).unwrapErr()).toBe(
      anotherObject,
    );
  });

  test("andThen/flatMap", () => {
    expect(
      Ok(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return Ok(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Ok(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return Err(anotherObject);
        })
        .unwrapErr(),
    ).toBe(anotherObject);
    expect(
      Ok(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return Ok(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Ok(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return Err(anotherObject);
        })
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("or", () => {
    expect(Ok(anObject).or(Ok(anotherObject)).unwrap()).toBe(anObject);
    expect(Ok(anObject).or(Err(anotherObject)).unwrap()).toBe(anObject);
  });

  test("orElse", () => {
    expect(Ok(anObject).orElse(notCalled).unwrap()).toBe(anObject);
  });

  test("transpose", () => {
    expect(Ok(Some(anObject)).transpose().unwrap().unwrap()).toBe(anObject);
    expect(Ok(None()).transpose().isNone()).toBe(true);
  });

  test("toPromise", async () => {
    expect(await Ok(anObject).toPromise()).toBe(anObject);
  });

  test("toString", () => {
    expect(Ok(42).toString()).toBe("Ok(42)");
  });

  test("@iterator", () => {
    expect(Array.from(Ok(anObject))).toEqual([anObject]);
  });
});

describe("Err", () => {
  test("error", () => {
    expect(constErr(anObject).error).toBe(anObject);
    // @ts-expect-error
    expect(Err(anObject).error).toBe(anObject);
    // @ts-expect-error
    expect(Ok(anObject).error).toBe(undefined);
  });

  test("isOk", () => {
    expect(Err(anObject).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(Err(anObject).isOkAnd(notCalled)).toBe(false);
  });

  test("isErr", () => {
    expect(Err(anObject).isErr()).toBe(true);
  });

  test("isErrAnd", () => {
    expect(Err(0).isErrAnd(isZero)).toBe(true);
    expect(Err(1).isErrAnd(isZero)).toBe(false);
  });

  test("expect", () => {
    const error1: any = Result.try(() => Err(anObject).expect("xyzzy")).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect(error1.message).toBe("xyzzy");
    const error2: any = Result.try(() => Err(anObject).expect(() => "xyzzy")).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect(error2.message).toBe("xyzzy");
  });

  test("expectErr", () => {
    expect(Err(anObject).expectErr("")).toBe(anObject);
    expect(Err(anObject).expectErr(notCalled)).toBe(anObject);
  });

  test("unwrap", () => {
    expect(Result.try(() => Err(anObject).unwrap()).unwrapErr()).toBe(anObject);
    expect(
      Result.try(() => Err(anObject).unwrap(() => anotherObject)).unwrapErr(),
    ).toBe(anotherObject);
  });

  test("unwrapOr", () => {
    expect(Err(anObject).unwrapOr(anotherObject)).toBe(anotherObject);
  });

  test("unwrapOrElse", () => {
    expect(Err(anObject).unwrapOrElse(() => anotherObject)).toBe(anotherObject);
  });

  test("unwrapUnchecked", () => {
    expect(Err(anObject).unwrapUnchecked()).toBe(undefined);
  });

  test("unwrapErr", () => {
    expect(Err(anObject).unwrapErr()).toBe(anObject);
    expect(Err(anObject).unwrapErr(notCalled)).toBe(anObject);
  });

  test("unwrapUnchecked", () => {
    expect(Err(anObject).unwrapErrUnchecked()).toBe(anObject);
  });

  test("ok", () => {
    expect(Err(anObject).ok().isNone()).toBe(true);
  });

  test("err", () => {
    expect(Err(anObject).err().unwrap()).toBe(anObject);
  });

  test("map", () => {
    expect(Err(anObject).map(notCalled).unwrapErr()).toBe(anObject);
  });

  test("mapOr", () => {
    expect(Err(anObject).mapOr(anotherObject, notCalled)).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(Err(anObject).mapOrElse(() => anotherObject, notCalled)).toBe(
      anotherObject,
    );
  });

  test("mapErr", () => {
    expect(
      Err(anObject)
        .mapErr((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("match", () => {
    expect(Err(anObject).match(notCalled, () => anotherObject)).toBe(
      anotherObject,
    );
  });

  test("and", () => {
    expect(Err(anObject).and(Ok(anotherObject)).unwrapErr()).toBe(anObject);
    expect(Err(anObject).and(Err(anotherObject)).unwrapErr()).toBe(anObject);
  });

  test("andThen/flatMap", () => {
    expect(Err(anObject).andThen(notCalled).unwrapErr()).toBe(anObject);
    expect(Err(anObject).flatMap(notCalled).unwrapErr()).toBe(anObject);
  });

  test("or", () => {
    expect(Err(anObject).or(Ok(anotherObject)).unwrap()).toBe(anotherObject);
    expect(Err(anObject).or(Err(anotherObject)).unwrapErr()).toBe(
      anotherObject,
    );
  });

  test("orElse", () => {
    expect(
      Err(anObject)
        .orElse(() => Ok(anotherObject))
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      Err(anObject)
        .orElse(() => Err(anotherObject))
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("transpose", () => {
    expect(
      Err<Option<T>, E>(anotherObject).transpose().unwrap().unwrapErr(),
    ).toBe(anotherObject);
  });

  test("toPromise", async () => {
    try {
      await await Err(anObject).toPromise();
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe(anObject);
    }
  });

  test("toString", () => {
    expect(Err(42).toString()).toBe("Err(42)");
  });

  test("@iterator", () => {
    expect(Array.from(Err(anObject))).toEqual([]);
  });
});
