import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constNone,
  constSome,
  isNone,
  isOption,
  isSome,
} from "../src/index";
import {
  CallCounter,
  R,
  SameType,
  T,
  expectArgs,
  notCalled,
  theE,
  theR,
  theT,
} from "./utils";

(expect as any).addEqualityTesters([
  function (this: any, a: unknown, b: unknown) {
    if (isOption(a) && isOption(b)) {
      return a.equals(b, this.equals);
    }
    return undefined;
  },
]);

describe("Option functions", () => {
  test("aliases", () => {
    constSome(theT) satisfies SameType<Option.Some<T>, Some<T>>;
    constNone() satisfies SameType<Option.None<T>, None<T>>;

    expect(Option.Some).toBe(Some);
    expect(Option.None).toBe(None);
    expect(Option.constSome).toBe(constSome);
    expect(Option.constNone).toBe(constNone);
    expect(Option.isOption).toBe(isOption);
    expect(Option.isSome).toBe(isSome);
    expect(Option.isNone).toBe(isNone);
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

  test("collect", () => {
    function* iter(yieldNone: boolean) {
      yield Some(1);
      yield Some(2);
      if (yieldNone) {
        yield None();
        throw Error("should not get here");
      }
    }
    expect(Option.collect(iter(true))).toEqual(None());
    expect(Option.collect(iter(false))).toEqual(Some([1, 2]));
  });

  test("constNone", () => {
    expect(constNone() satisfies None<T>).toEqual(None());
  });

  test("constSome", () => {
    expect(constSome(theT) satisfies Some<T>).toEqual(Some(theT));
  });

  test("equals", () => {
    expect(Option.equals(theT, theT)).toBe(false);
    expect(Option.equals(Some(theT), theT)).toBe(false);
    expect(Option.equals(theT, Some(theT))).toBe(false);
    testEqualsFn(Option.equals);
  });

  test("fromNullable", () => {
    expect(Option.fromNullable(null)).toEqual(None());
    expect(Option.fromNullable(undefined)).toEqual(None());
    expect(Option.fromNullable(0)).toEqual(Some(0));
    expect(Option.fromNullable("")).toEqual(Some(""));
    expect(Option.fromNullable(false)).toEqual(Some(false));
  });

  test("isOption", () => {
    expect(isOption(Some(0))).toBe(true);
    expect(isOption(None())).toBe(true);
    expect(isOption(null)).toBe(false);
    expect(isOption(undefined)).toBe(false);
    expect(isOption(theT)).toBe(false);
  });

  test("isSome", () => {
    expect(isSome(Some(0))).toBe(true);
    expect(isSome(None())).toBe(false);
    expect(isSome(null)).toBe(false);
    expect(isSome(undefined)).toBe(false);
    expect(isSome(theT)).toBe(false);
  });

  test("isNone", () => {
    expect(isNone(Some(0))).toBe(false);
    expect(isNone(None())).toBe(true);
    expect(isNone(null)).toBe(false);
    expect(isNone(undefined)).toBe(false);
    expect(isNone(theT)).toBe(false);
  });
});

describe("Option methods", () => {
  test("@@iterator", () => {
    expect(Array.from(Some(theT))).toEqual([theT]);
    expect(Array.from(None())).toEqual([]);
  });

  test("and", () => {
    expect(Some(theT).and(Some(theE)).unwrap()).toBe(theE);
    expect(Some(theT).and(None()).isNone()).toBe(true);
    expect(None().and(Some(theE)).isNone()).toBe(true);
    expect(None().and(None()).isNone()).toBe(true);
  });

  test("andThen", () => {
    expect(
      Some(theT)
        .andThen(expectArgs(Some(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).andThen(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(Some(theT).andThen(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(None().andThen(notCalled).isNone()).toBe(true);
  });

  // @copy-test flatMap
  test("flatMap", () => {
    expect(
      Some(theT)
        .flatMap(expectArgs(Some(theR), theT))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).flatMap(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(Some(theT).flatMap(expectArgs(None(), theT)).isNone()).toBe(true);
    expect(None().flatMap(notCalled).isNone()).toBe(true);
  });

  test("equals", () => {
    testEqualsFn((a, b, cmp) => a.equals(b, cmp));
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

  test("filter", () => {
    expect(Some(theT).filter(expectArgs(1, theT)).unwrap()).toBe(theT);
    expect(Some(theT).filter(expectArgs(0, theT)).isNone()).toBe(true);
    expect(Some(theT).filter(expectArgs(0, theT)).isNone()).toBe(true);
    expect(None().filter(notCalled).isNone()).toBe(true);

    constNone<any>().filter(notCalled as unknown as (arg: any) => arg is T[]) satisfies Option<T[]>;
    constSome<any>(theT).filter(expectArgs(true, theT) as unknown as (arg: any) => arg is T[]) satisfies Option<T[]>;
  });


  test("filterByType", () => {
    expect(Some(0).filterByType("bigint") satisfies Option<bigint>).toEqual(None());
    expect(Some(0).filterByType("boolean") satisfies Option<boolean>).toEqual(None());
    expect(Some("").filterByType("number") satisfies Option<number>).toEqual(None());
    expect(Some(0).filterByType("object") satisfies Option<object>).toEqual(None());
    expect(Some(0).filterByType("string") satisfies Option<string>).toEqual(None());
    expect(Some(0).filterByType("symbol") satisfies Option<symbol>).toEqual(None());
    expect(Some(0).filterByType("undefined") satisfies Option<undefined>).toEqual(None());

    expect(Some(0n).filterByType("bigint").unwrap() === 0n).toBe(true);
    expect(Some(false).filterByType("boolean") satisfies Option<boolean>).toEqual(Some(false));
    expect(Some(0).filterByType("number") satisfies Option<number>).toEqual(Some(0));
    expect(Some(null).filterByType("object") satisfies Option<object>).toEqual(Some(null));
    expect(Some("").filterByType("string") satisfies Option<string>).toEqual(Some(""));
    expect(Some(Symbol.iterator).filterByType("symbol") satisfies Option<symbol>).toEqual(
      Some(Symbol.iterator),
    );
    expect(Some(undefined).filterByType("undefined") satisfies Option<undefined>).toEqual(Some(undefined));
  });

  test("filterInstanceOf", () => {
    class A { a = 0; }
    class B extends A { b = 0; }

    expect(Some<A>(new B()).filterInstanceOf(B) satisfies Option<B>).toEqual(Some(new B()));
    expect(Some<A>(new A()).filterInstanceOf(B) satisfies Option<B>).toEqual(None());
    expect(None<A>().filterInstanceOf(B) satisfies Option<B>).toEqual(None());
  })

  test("flatten", () => {
    expect(Some(Some(theT)).flatten().unwrap()).toBe(theT);
    expect(Some(None()).flatten().isNone()).toBe(true);
    expect(None<Option<T>>().flatten().isNone()).toBe(true);
  });

  test("isNone", () => {
    expect(Some(theT).isNone()).toBe(false);
    expect(None().isNone()).toBe(true);
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

  test("map", () => {
    expect(Some(theT).map(expectArgs(theR, theT)).unwrap()).toBe(theR);
    expect(None().map(notCalled).isNone()).toBe(true);
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

  test("nonNullable", () => {
    expect(Some(theT).nonNullable()).toEqual(Some(theT));
    expect(Some(null).nonNullable()).toEqual(None());
    expect(Some(undefined).nonNullable()).toEqual(None());
    expect(None().nonNullable()).toEqual(None());
  });

  test("okOr", () => {
    expect(Some(theT).okOr(theE).unwrap()).toBe(theT);
    expect(None().okOr(theE).unwrapErr()).toBe(theE);
  });

  test("okOrElse", () => {
    expect(Some(theT).okOrElse(notCalled).unwrap()).toBe(theT);
    expect(None().okOrElse(expectArgs(theR)).unwrapErr()).toBe(theR);
    expect(None().okOrElse(expectArgs(theR)).unwrapErr()).toBe(theR);
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

  test("tap", () => {
    const some = Some(theT);
    const someFunc = jest.fn(expectArgs(undefined, some));
    expect(some.tap(someFunc)).toBe(some);
    expect(someFunc).toHaveBeenCalledTimes(1);

    const noneFunc = jest.fn(expectArgs(undefined, None()));
    expect(None().tap(noneFunc)).toBe(None());
    expect(noneFunc).toHaveBeenCalledTimes(1);
  });

  test("tapNone", () => {
    const some = Some(theT);
    expect(some.tapNone(notCalled)).toBe(some);

    const mockFunc = jest.fn(expectArgs(theR));
    expect(None().tapNone(mockFunc)).toBe(None());
    expect(mockFunc).toHaveBeenCalledTimes(1);
  });

  test("tapSome", () => {
    const mockFunc = jest.fn(expectArgs(theR, theT));
    const some = Some(theT);
    expect(some.tapSome(mockFunc)).toBe(some);
    expect(mockFunc).toHaveBeenCalledTimes(1);

    expect(None().tapSome(notCalled)).toBe(None());
  });

  test("transpose", () => {
    expect(Some(Ok(theT)).transpose().unwrap().unwrap()).toBe(theT);
    expect(Some(Err(theT)).transpose().unwrapErr()).toBe(theT);
    expect(None<Result<unknown, unknown>>().transpose().unwrap().isNone()).toBe(
      true,
    );
  });

  test("toString", () => {
    expect(Some(42).toString()).toBe("Some(42)");
    expect(None().toString()).toBe("None()");
  });

  test("unwrap", () => {
    expect(Some(theT).unwrap()).toBe(theT);
    expect(Some(theT).unwrap(notCalled)).toBe(theT);
    expect(() => None().unwrap()).toThrow(Error);
    expect(() => None().unwrap(() => new Error("xyzzy"))).toThrow("xyzzy");
  });

  test("unwrapOrUndef", () => {
    expect(Some(theT).unwrapOrUndef()).toBe(theT);
    expect(None().unwrapOrUndef()).toBe(undefined);
  });

  // @copy-test toNullable
  test("toNullable", () => {
    expect(Some(theT).toNullable()).toBe(theT);
    expect(None().toNullable()).toBe(undefined);
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

  test("value", () => {
    expect(constSome(theT).value).toBe(theT);
    // @ts-expect-error
    expect(Some(theT).value).toBe(theT);
    // @ts-expect-error
    expect(None(theT).value).toBe(undefined);
  });

  test("withType", () => {
    expect(constNone<T>().withType<R>() satisfies Option<R>);
  });

  test("xor", () => {
    expect(Some(theT).xor(Some(theE)).isNone()).toBe(true);
    expect(Some(theT).xor(None()).unwrap()).toBe(theT);
    expect(None().xor(Some(theE)).unwrap()).toBe(theE);
    expect(None().xor(None()).isNone()).toBe(true);
  });

  test("zip", () => {
    expect(Some(theT).zip(Some(theE))).toEqual(Some([theT, theE]));
    expect(Some(theT).zip(None())).toEqual(None());
    expect(None().zip(Some(theE))).toEqual(None());
    expect(None().zip(None())).toEqual(None());
  });

  test("zipWith", () => {
    expect(
      Some(theT)
        .zipWith(Some(theE), expectArgs(theR, theT, theE))
        .unwrap(),
    ).toBe(theR);
    expect(Some(theT).zipWith(None(), notCalled)).toEqual(None());
    expect(None().zipWith(Some(theR), notCalled)).toEqual(None());
  });
});

function testEqualsFn(
  eq: (
    a: Option<unknown>,
    b: Option<unknown>,
    cmp?: (aValue: unknown, bValue: unknown) => boolean,
  ) => boolean,
): void {
  expect(eq(Some(theT), Some(theT))).toBe(true);
  expect(eq(Some(theT), Some(theE))).toBe(false);
  expect(eq(Some(theT), None())).toBe(false);
  expect(eq(None(), Some(theT))).toBe(false);
  expect(eq(None(), None())).toBe(true);

  expect(eq(Some(Some(theT)), Some(Some(theT)))).toBe(true);
  expect(eq(Some(Some(theT)), Some(Some(theE)))).toBe(false);
  expect(eq(Some(Some(theT)), Some(None()))).toBe(false);
  expect(eq(None(), Some(None()))).toBe(false);
  expect(eq(None(), None())).toBe(true);

  for (const innerEqual of [true, false]) {
    for (const [left, right] of [
      [theT, theT],
      [theT, theE],
      [Some(theT), Some(theT)],
      [Some(theT), Some(theE)],
    ]) {
      const counter = new CallCounter();
      expect(
        eq(
          Some(left),
          Some(right),
          counter.expectArgs(innerEqual, left, right),
        ),
      ).toBe(innerEqual);
      expect(counter.count).toBe(1);
    }
  }
  expect(eq(Some(theT), None(), notCalled)).toBe(false);
  expect(eq(None(), Some(theT), notCalled)).toBe(false);
}

describe("recipes", () => {
  test("fromTruthy", () => {
    expect(Some("hello").filter(Boolean)).toEqual(Some("hello"));
    expect(Some(null).filter(Boolean)).toEqual(None());
    expect(Some(undefined).filter(Boolean)).toEqual(None());
    expect(Some(0).filter(Boolean)).toEqual(None());
    expect(Some("").filter(Boolean)).toEqual(None());
    expect(Some(false).filter(Boolean)).toEqual(None());
  });

  test("unwrapSomes", () => {
    expect([Some(1), None(), Some(2), None()].flatMap(x=>[...x])).toEqual([1,2]);
  });
});
