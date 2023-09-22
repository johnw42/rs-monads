import {
  Err,
  None,
  Ok,
  Option,
  Result,
  Some,
  constErr,
  constNone,
  constOk,
  constSome,
  fromNullable,
  isNone,
  isOption,
  isSome,
} from "../src/index";
import {
  CallCounter,
  SameType,
  R,
  T,
  expectArgs,
  notCalled,
  theE,
  theR,
  theT,
  E,
} from "./utils";

describe("Option functions", () => {
  test("aliases", () => {
    true satisfies SameType<Option.Some<T>, Some<T>>;
    true satisfies SameType<Option.None<T>, None<T>>;

    expect(Option.Some).toBe(Some);
    expect(Option.None).toBe(None);
    expect(Option.constSome).toBe(constSome);
    expect(Option.constNone).toBe(constNone);
    expect(Option.fromNullable).toBe(fromNullable);
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
    expect(constSome(theT).and(constSome(theE)) satisfies Some<E>).toEqual(
      Some(theE),
    );
    expect(constSome(theT).and(constNone<E>()) satisfies None<E>).toEqual(
      None(),
    );
    expect(constNone<T>().and(constSome(theE)) satisfies None<E>).toEqual(
      None(),
    );
    expect(constNone<T>().and(None<E>()) satisfies None<E>).toEqual(None());
  });

  test("andThen", () => {
    expect(
      constSome(theT).andThen(
        expectArgs(constSome(theR), theT),
      ) satisfies Some<R>,
    ).toEqual(Some(theR));
    expect(
      constSome(theT).andThen(
        expectArgs(constNone<R>(), theT),
      ) satisfies None<R>,
    ).toEqual(None());
    expect(constNone().andThen(notCalled) satisfies None<R>).toEqual(None());
  });

  // @copy-test flatMap
  test("flatMap", () => {
    expect(
      constSome(theT).flatMap(
        expectArgs(constSome(theR), theT),
      ) satisfies Some<R>,
    ).toEqual(Some(theR));
    expect(
      constSome(theT).flatMap(
        expectArgs(constNone<R>(), theT),
      ) satisfies None<R>,
    ).toEqual(None());
    expect(constNone().flatMap(notCalled) satisfies None<R>).toEqual(None());
  });

  test("equals", () => {
    constSome(theT).equals(constSome(theE)) satisfies boolean;
    // constSome(theT).equals(constNone<E>()) satisfies false;
    // constNone<T>().equals(constSome(theE)) satisfies false;
    // constNone<T>().equals(constNone<E>()) satisfies true;
    None<T>().equals(None<E>()) satisfies boolean;

    testEqualsFn((a, b, cmp) => a.equals(b, cmp));
  });

  test("expect", () => {
    expect(constSome(theT).expect("") satisfies T).toBe(theT);
    expect(constSome(theT).expect(notCalled) satisfies T).toBe(theT);

    const error1 = Result.try(() => None().expect("xyzzy")).unwrapErr();
    expect(error1).toBeInstanceOf(Error);
    expect((error1 as Error).message).toBe("xyzzy");
    const error2 = Result.try(
      () => constNone().expect(() => "xyzzy") satisfies never,
    ).unwrapErr();
    expect(error2).toBeInstanceOf(Error);
    expect((error2 as Error).message).toBe("xyzzy");
  });

  test("filter", () => {
    expect(Some(theT).filter(expectArgs(1, theT))).toEqual(Some(theT));
    expect(Some(theT).filter(expectArgs(0, theT))).toEqual(None());
    expect(Some(theT).filter(expectArgs(0, theT))).toEqual(None());
    expect(None().filter(notCalled)).toEqual(None());

    constNone<any>().filter(
      notCalled as unknown as (arg: any) => arg is T[],
    ) satisfies Option<T[]>;
    constSome<any>(theT).filter(
      expectArgs(true, theT) as unknown as (arg: any) => arg is T[],
    ) satisfies Option<T[]>;
  });

  test("filterClass", () => {
    class A {
      a = 0;
    }
    class B extends A {
      b = 0;
    }

    expect(constSome<A>(new B()).filterClass(B) satisfies Option<B>).toEqual(
      Some(new B()),
    );
    expect(constSome<A>(new A()).filterClass(B) satisfies Option<B>).toEqual(
      None(),
    );
    expect(constNone<A>().filterClass(B) satisfies None<B>).toEqual(None());
  });

  test("filterType", () => {
    expect(constSome(0).filterType("bigint") satisfies Option<bigint>).toEqual(
      None(),
    );
    expect(
      constSome(0).filterType("boolean") satisfies Option<boolean>,
    ).toEqual(None());
    expect(constSome("").filterType("number") satisfies Option<number>).toEqual(
      None(),
    );
    expect(constSome(0).filterType("object") satisfies Option<object>).toEqual(
      None(),
    );
    expect(constSome(0).filterType("string") satisfies Option<string>).toEqual(
      None(),
    );
    expect(constSome(0).filterType("symbol") satisfies Option<symbol>).toEqual(
      None(),
    );
    expect(
      constSome(0).filterType("undefined") satisfies Option<undefined>,
    ).toEqual(None());
    expect(constNone().filterType("number") satisfies None<number>).toEqual(
      None(),
    );

    expect(constSome(0n).filterType("bigint").unwrap() === 0n).toBe(true);
    expect(
      constSome(false).filterType("boolean") satisfies Option<boolean>,
    ).toEqual(Some(false));
    expect(constSome(0).filterType("number") satisfies Option<number>).toEqual(
      Some(0),
    );
    expect(
      constSome(null).filterType("object") satisfies Option<object>,
    ).toEqual(Some(null));
    expect(constSome("").filterType("string") satisfies Option<string>).toEqual(
      Some(""),
    );
    expect(
      constSome(Symbol.iterator).filterType("symbol") satisfies Option<symbol>,
    ).toEqual(Some(Symbol.iterator));
    expect(
      constSome(undefined).filterType("undefined") satisfies Option<undefined>,
    ).toEqual(Some(undefined));
  });

  test("flatten", () => {
    expect(constSome(constSome(theT)).flatten() satisfies Some<T>).toEqual(
      Some(theT),
    );
    expect(constSome(constNone<T>()).flatten() satisfies None<T>).toEqual(
      None(),
    );
    expect(constNone<Option<T>>().flatten() satisfies None<T>).toEqual(None());
  });

  test("isNone", () => {
    expect(Some(theT).isNone()).toBe(false);
    expect(None()).toEqual(None());
  });

  test("isSome", () => {
    expect(Some(0).isSome()).toBe(true);
    expect(None().isSome()).toBe(false);
  });

  test("isSomeAnd", () => {
    expect(
      constSome(theT).isSomeAnd(expectArgs(true, theT)) satisfies boolean,
    ).toBe(true);
    expect(
      constSome(theT).isSomeAnd(expectArgs(false, theT)) satisfies boolean,
    ).toBe(false);
    expect(constNone().isSomeAnd(notCalled) satisfies false).toBe(false);
  });

  test("map", () => {
    expect(
      constSome(theT).map(expectArgs(theR, theT)) satisfies Some<R>,
    ).toEqual(Some(theR));
    expect(constNone().map(notCalled) satisfies None<R>).toEqual(None());
  });

  test("mapOr", () => {
    expect(
      constSome(theT).mapOr(theE, expectArgs(theR, theT)) satisfies R,
    ).toBe(theR);
    expect(constNone().mapOr(theE, notCalled) satisfies E).toBe(theE);
  });

  test("mapOrElse", () => {
    expect(
      Some(theT).mapOrElse(notCalled, expectArgs(theR, theT)) satisfies R,
    ).toBe(theR);
    expect(None().mapOrElse(expectArgs(theE), notCalled) satisfies E).toBe(
      theE,
    );
  });

  test("mapOrUndef", () => {
    expect(constSome(theT).mapOrUndef(expectArgs(theR, theT)) satisfies R).toBe(
      theR,
    );
    expect(constNone().mapOrUndef(notCalled) satisfies undefined).toBe(
      undefined,
    );
  });

  test("nonNullable", () => {
    expect(
      constSome<T | undefined | null>(theT).nonNullable() satisfies Option<T>,
    ).toEqual(Some(theT));
    expect(constSome<T | null>(null).nonNullable() satisfies Option<T>).toEqual(
      None(),
    );
    expect(
      constSome<T | undefined>(undefined).nonNullable() satisfies Option<T>,
    ).toEqual(None());
    expect(constNone<T>().nonNullable() satisfies None<T>).toEqual(None());
  });

  test("okOr", () => {
    expect(constSome(theT).okOr(theE) satisfies Ok<T, E>).toEqual(Ok(theT));
    expect(constNone<T>().okOr(theE) satisfies Err<T, E>).toEqual(Err(theE));
  });

  test("okOrElse", () => {
    expect(Some(theT).okOrElse(notCalled)).toEqual(Ok(theT));
    expect(None().okOrElse(expectArgs(theR)).unwrapErr()).toBe(theR);
    expect(None().okOrElse(expectArgs(theR)).unwrapErr()).toBe(theR);
  });

  test("or", () => {
    expect(constSome(theT).or(constSome(theE)) satisfies Some<T>).toEqual(
      Some(theT),
    );
    expect(constSome(theT).or(constNone()) satisfies Some<T>).toEqual(
      Some(theT),
    );
    expect(constNone().or(constSome(theE)) satisfies Some<E>).toEqual(
      Some(theE),
    );
    expect(constNone<T>().or(constNone<E>()) satisfies None<E>).toEqual(None());
  });

  test("orElse", () => {
    expect(constSome(theT).orElse(notCalled) satisfies Some<T>).toEqual(
      Some(theT),
    );
    expect(
      constNone<T>().orElse(expectArgs(constSome(theR))) satisfies Some<R>,
    ).toEqual(Some(theR));
    expect(
      constNone<T>().orElse(expectArgs(constNone<R>())) satisfies None<R>,
    ).toEqual(None());
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
    constSome(Ok<T, E>(theT)).transpose() satisfies Result<Some<T>, E>;

    expect(
      constSome(constOk<T, E>(theT)).transpose() satisfies Ok<Some<T>, E>,
    ).toEqual(Ok(Some(theT)));
    expect(
      constSome(constErr<T, E>(theE)).transpose() satisfies Err<Some<T>, E>,
    ).toEqual(Err(theE));
    expect(
      constNone<Result<T, E>>().transpose() satisfies Ok<None<T>, E>,
    ).toEqual(Ok(None()));
  });

  test("toString", () => {
    expect(Some(42).toString()).toBe("Some(42)");
    expect(None().toString()).toBe("None()");
  });

  test("unwrap", () => {
    expect(constSome(theT).unwrap() satisfies T).toEqual(theT);
    expect(constSome(theT).unwrap(notCalled) satisfies T).toEqual(theT);
    expect(() => constNone().unwrap() satisfies never).toThrow(Error);
    expect(
      () => constNone().unwrap(() => new Error("xyzzy")) satisfies never,
    ).toThrow("xyzzy");
  });

  test("unwrapOr", () => {
    expect(Some(theT).unwrapOr(theE)).toBe(theT);
    expect(None().unwrapOr(theE)).toBe(theE);
  });

  test("unwrapOrUndef", () => {
    expect(constSome(theT).unwrapOrUndef() satisfies T).toBe(theT);
    expect(constNone().unwrapOrUndef() satisfies undefined).toBe(undefined);
  });

  // @copy-test toNullable
  test("toNullable", () => {
    expect(constSome(theT).toNullable() satisfies T).toBe(theT);
    expect(constNone().toNullable() satisfies undefined).toBe(undefined);
  });

  test("unwrapOrElse", () => {
    expect(constSome(theT).unwrapOrElse(notCalled) satisfies T).toBe(theT);
    expect(constNone().unwrapOrElse(expectArgs(theR)) satisfies R).toBe(theR);
  });

  test("unwrapUnchecked", () => {
    expect(constSome(theT).unwrapUnchecked() satisfies T).toBe(theT);
    expect(constNone<T>().unwrapUnchecked() satisfies never).toBe(undefined);
  });

  test("value", () => {
    expect(constSome(theT).value satisfies T).toBe(theT);
    // @ts-expect-error
    expect(Some(theT).value).toBe(theT);
    // @ts-expect-error
    expect(None(theT).value).toBe(undefined);
  });

  test("withType", () => {
    expect(constNone<T>().withType<R>() satisfies None<R>);
  });

  test("unzip", () => {
    expect(
      constSome([theT, theE] as [T, E]).unzip() satisfies [Some<T>, Some<E>],
    ).toEqual([Some(theT), Some(theE)]);
    expect(
      constNone<[T,E]>().unzip() satisfies [None<T>, None<E>],
    ).toEqual([None(), None()]);
  });

  test("xor", () => {
    expect(constSome(theT).xor(constSome(theE)) satisfies None<T & E>).toEqual(
      None(),
    );
    expect(constSome(theT).xor(constNone<E>()) satisfies Some<T>).toEqual(
      Some(theT),
    );
    expect(constNone<T>().xor(constSome(theE)) satisfies Some<E>).toEqual(
      Some(theE),
    );
    expect(constNone<T>().xor(constNone<E>()) satisfies None<T & E>).toEqual(
      None(),
    );
  });

  test("zip", () => {
    expect(constSome(theT).zip(constSome(theE)) satisfies Some<[T, E]>).toEqual(
      Some([theT, theE]),
    );
    expect(constSome(theT).zip(constNone<E>()) satisfies None<[T, E]>).toEqual(
      None(),
    );
    expect(constNone<T>().zip(constSome(theE)) satisfies None<[T, E]>).toEqual(
      None(),
    );
    expect(constNone<T>().zip(constNone<E>()) satisfies None<[T, E]>).toEqual(
      None(),
    );
  });

  test("zipWith", () => {
    expect(
      constSome(theT).zipWith(
        constSome(theE),
        expectArgs(theR, theT, theE),
      ) satisfies Some<R>,
    ).toEqual(Some(theR));
    expect(
      constSome(theT).zipWith(constNone(), notCalled) satisfies None<R>,
    ).toEqual(None());
    expect(
      constNone().zipWith(constSome(theE), notCalled) satisfies None<R>,
    ).toEqual(None());
    expect(
      constNone().zipWith(constNone(), notCalled) satisfies None<R>,
    ).toEqual(None());
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
    expect([Some(1), None(), Some(2), None()].flatMap((x) => [...x])).toEqual([
      1, 2,
    ]);
  });
});
