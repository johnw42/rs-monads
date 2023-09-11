import { Result, isResult, err, ok, constOk, constErr } from "../src/Result";

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
  test("ok", () => {
    expect(ok(0).isOk()).toBe(true);
  });

  test("err", () => {
    expect(err(anObject).isOk()).toBe(false);
  });

  test("constOk", () => {
    expect(constOk(0).isOk()).toBe(true);
  });

  test("err", () => {
    expect(constErr(anObject).isOk()).toBe(false);
  });

  test("isOption", () => {
    expect(isResult(ok(0))).toBe(true);
    expect(isResult(err(""))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult(undefined)).toBe(false);
    expect(isResult(anObject)).toBe(false);
  });

  test("fromPromise", async () => {
    expect((await Result.fromPromise(Promise.resolve(anObject))).unwrap()).toBe(anObject);
    expect((await Result.fromPromise(Promise.reject(anObject))).unwrapErr()).toBe(anObject);
  });
});

describe("Some", () => {
  test("isOk", () => {
    expect(ok(0).isOk()).toBe(true);
  });

  test("isOkAnd", () => {
    expect(ok(0).isOkAnd(isZero)).toBe(true);
    expect(ok(1).isOkAnd(isZero)).toBe(false);
  });

  test("isErr", () => {
    expect(ok(0).isErr()).toBe(false);
  });

  test("isErrAnd", () => {
    expect(ok(0).isErrAnd(notCalled)).toBe(false);
  });

  test("expect", () => {
    expect(ok(anObject).expect("")).toBe(anObject);
    expect(ok(anObject).expect(notCalled)).toBe(anObject);
  });

  test("unwrap", () => {
    expect(ok(anObject).unwrap()).toBe(anObject);
    expect(ok(anObject).unwrap(notCalled)).toBe(anObject);
  });

  test("unwrapOr", () => {
    expect(ok(anObject).unwrapOr(anotherObject)).toBe(anObject);
  });

  test("unwrapOrElse", () => {
    expect(ok(anObject).unwrapOrElse(notCalled)).toBe(anObject);
  });

  test("unwrapErr", () => {
    expect(() => ok(anObject).unwrapErr()).toThrow(Error);
    expect(() => ok(anObject).unwrapErr(() => new Error("xyzzy"))).toThrow(
      "xyzzy",
    );
  });

  test("ok", () => {
    expect(ok(anObject).ok().unwrap()).toBe(anObject);
  })

  test("err", () => {
    expect(ok(anObject).err().isNone()).toBe(true);
  })

  test("map", () => {
    expect(
      ok(anObject)
        .map((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrap(),
    ).toBe(anotherObject);
  });

  test("mapOr", () => {
    expect(
      ok(anObject).mapOr(0, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(
      ok(anObject).mapOrElse(notCalled, (value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }),
    ).toBe(anotherObject);
  });

  test("mapErr", () => {
    expect(ok(anObject).mapErr(notCalled).unwrap()).toBe(anObject);
  });

  test("match", () => {
    expect(
      ok(anObject).match((value) => {
        expect(value).toBe(anObject);
        return anotherObject;
      }, notCalled),
    ).toBe(anotherObject);
  });

  test("and", () => {
    expect(ok(anObject).and(ok(anotherObject)).unwrap()).toBe(anotherObject);
    expect(ok(anObject).and(err(anotherObject)).unwrapErr()).toBe(
      anotherObject,
    );
  });

  test("andThen/flatMap", () => {
    expect(
      ok(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return ok(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      ok(anObject)
        .andThen((value) => {
          expect(value).toBe(anObject);
          return err(anotherObject);
        })
        .unwrapErr(),
    ).toBe(anotherObject);
    expect(
      ok(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return ok(anotherObject);
        })
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      ok(anObject)
        .flatMap((value) => {
          expect(value).toBe(anObject);
          return err(anotherObject);
        })
        .unwrapErr(),
    ).toBe(anotherObject);
  });

  test("or", () => {
    expect(ok(anObject).or(ok(anotherObject)).unwrap()).toBe(anObject);
    expect(ok(anObject).or(err(anotherObject)).unwrap()).toBe(anObject);
  });

  test("orElse", () => {
    expect(ok(anObject).orElse(notCalled).unwrap()).toBe(anObject);
  });

  test("toPromise", async () => {
    expect(await ok(anObject).toPromise()).toBe(anObject);
  })

  test("@iterator", () => {
    expect(Array.from(ok(anObject))).toEqual([anObject]);
  })
});

describe("None", () => {
  test("isOk", () => {
    expect(err(anObject).isOk()).toBe(false);
  });

  test("isOkAnd", () => {
    expect(err(anObject).isOkAnd(notCalled)).toBe(false);
  });

  test("isErr", () => {
    expect(err(anObject).isErr()).toBe(true);
  });

  test("isErrAnd", () => {
    expect(err(0).isErrAnd(isZero)).toBe(true);
    expect(err(1).isErrAnd(isZero)).toBe(false);
  });

  test("expect", () => {
    expect(() => err(anObject).expect("xyzzy")).toThrow("xyzzy");
    expect(() => err(anObject).expect(() => "xyzzy")).toThrow("xyzzy");
  });

  test("unwrap", () => {
    expect(() => err(anObject).unwrap()).toThrow(Error);
    expect(() => err(anObject).unwrap(() => new Error("xyzzy"))).toThrow(
      "xyzzy",
    );
  });

  test("unwrapOr", () => {
    expect(err(anObject).unwrapOr(anotherObject)).toBe(anotherObject);
  });

  test("unwrapOrElse", () => {
    expect(err(anObject).unwrapOrElse(() => anotherObject)).toBe(anotherObject);
  });

  test("unwrap", () => {
    expect(err(anObject).unwrapErr()).toBe(anObject);
    expect(err(anObject).unwrapErr(notCalled)).toBe(anObject);
  });

  test("ok", () => {
    expect(err(anObject).ok().isNone()).toBe(true);
  })
  
  test("err", () => {
    expect(err(anObject).err().unwrap()).toBe(anObject);
  })

  test("map", () => {
    expect(err(anObject).map(notCalled).unwrapErr()).toBe(anObject);
  });

  test("mapOr", () => {
    expect(err(anObject).mapOr(anotherObject, notCalled)).toBe(anotherObject);
  });

  test("mapOrElse", () => {
    expect(err(anObject).mapOrElse(() => anotherObject, notCalled)).toBe(
      anotherObject,
    );
  });

  test("mapErr", () => {
    expect(
      err(anObject)
        .mapErr((value) => {
          expect(value).toBe(anObject);
          return anotherObject;
        })
        .unwrapErr(),
    ).toBe(anotherObject);
 })

  test("match", () => {
    expect(err(anObject).match(notCalled, () => anotherObject)).toBe(
      anotherObject,
    );
  });

  test("and", () => {
    expect(err(anObject).and(ok(anotherObject)).unwrapErr()).toBe(anObject);
    expect(err(anObject).and(err(anotherObject)).unwrapErr()).toBe(anObject);
  });

  test("andThen/flatMap", () => {
    expect(err(anObject).andThen(notCalled).unwrapErr()).toBe(anObject);
    expect(err(anObject).flatMap(notCalled).unwrapErr()).toBe(anObject);
  });

  test("or", () => {
    expect(err(anObject).or(ok(anotherObject)).unwrap()).toBe(anotherObject);
    expect(err(anObject).or(err(anotherObject)).unwrapErr()).toBe(
      anotherObject,
    );
  });

  test("orElse", () => {
    expect(
      err(anObject)
        .orElse(() => ok(anotherObject))
        .unwrap(),
    ).toBe(anotherObject);
    expect(
      err(anObject)
        .orElse(() => err(anotherObject))
        .unwrapErr(),
    ).toBe(anotherObject);
  });
  
  test("toPromise", async () => {
    try {
      await await err(anObject).toPromise();
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe(anObject);
    }
  })

  test("@iterator", () => {
    expect(Array.from(err(anObject))).toEqual([]);
  })
});
