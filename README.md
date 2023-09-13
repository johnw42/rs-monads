# rs-monads

This package contains based heavily on Rust's main monad types: `Option` and
`Result`.  Why use copy Rust APIs?  Aside from familiarity to Rust developers, I
just like the way the Rust API is designed and I find the method names regular
enough that it's easy to remember most of the based on a few patterns.



## A Motivating Example

JavaScript's `?.` operator makes it easy to conditionally call methods when the
receiver may be `null` or `undefined` and the methods themselves may return
`undefined` or `null`:

```ts
function pipeline(a: A | undefined): D | undefined {
  return a?.convertToB().convertToC()?.convertToD()
}
```

But what if we're using functions instead of methods?  Consider these three functions:

```ts
function convertAToB(a: A): B  {...}
function convertBToC(b: B): C | null {...}
function convertCToD(c: C): D | undefined {...}
```

Chaining them together can get very ugly:

```ts
function pipeline1(a: A | undefined): D | undefined {
  if (a === undefined) {
    return undefined;
  }
  const b = convertAToB(a);
  const c = convertBToC(b);
  if (c === null) {
    return undefined;
  }
  const d = convertCToD(c);
  return d;
}
```

But with the `Option` type, it looks a lot more like calling a series of methods
with the `?.` operator:

```ts
function pipeline2(a: A | undefined): D | undefined {
  return fromNullable(a)
    .map(convertAToB)
    .mapNullable(convertBToC)
    .mapNullable(convertCToD)
    .toNullable()
}
```



## Types Defined by This Package

**`Option<T> = Some<T> | None<T>`**

A type that may or may not contain a value of type `T`.  `Some<T>` contains a
value and `None<T>` does not.  These subtypes are also aliased as
`Option.Some<T>` and `Option.None<T>`.

**`Result<T,E> = Ok<T,E> | Err<T,E>`**

A type that value of type `T | E`  `Ok<T,E>` contains a
value of type `T` and `Err<T,E>` contains a value of type `E` (which typically
represents an error). These subtypes are also aliased as `Result.Ok<T,E>` and
`Result.Err<T,E>`.



## Important Functions and Methods

(This is not a comprehensive list; see the source code or the generates `.d.ts`
files for complete documentation.)

### Creating values

**`Some(x)`** (alias: `Option.Some`)

Creates a `Some` value containing `x`.

**`None()`** (alias: `Option.None`)

Returns a `None` value not containing anything.

**`Ok(x)`** (alias: `Result.Ok`)

Creates an `Ok` value containing `x`.

**`Err(e)`** (alias: `Result.Err`)

Creates an `Err` value containing `e`.

**`constSome(x)`** (alias: `Option.constSome`)<br/>
**`constNone(x)`** (alias: `Option.constNone`)<br/>
**`constOk(x)`** (alias: `Option.constOk`)<br/>
**`constErr(e)`** (alias: `Option.constErr`)

Alternate versions of the similarly-named functions above with a more precise
return type suitable for intializing constants.

**`fromNullable(x)`** (alias: `Option.fromNullable`)

Returns `None()` if `x` is null or undefined, otherwise returns `Some(x)`.

### Extracting the contents of Option and Result values

**`m.unwrap()`**<br/>
**`m.expect("m should have a value")`**

If `m` is `Some(x)` or `Ok(x)`, returns `x`, otherwise throws an error. If `m`
is `Err(e)`, `unwrap` throws `e`.

**`m.unwrapOr(def)`**<br/>
**`m.unwrapOrElse(lazyDef)`**

If `m` is `Some(x)` or `Ok(x)`, returns `x`, otherwise returns `def`  or
`lazyDef()`.

**`m.match(f, g)`**<br/>
**`m.match({Some: f, None: g})`**<br/>
**`m.match({Ok: f, Err: g})`**

This method simulates a Rust `match` expression, calling `f(x)` for `Some(x)` or
`Ok(x)`, `g()` for `None()`, or `g(e)` for `Err(e)`, and returning the result.

In the second and third signatures, either `f` or `g` is omitted, in which case
the remaining function is called for its side-effect,and the method returns
`undefined`.

**`m.toNullable()`** (`Option` only)

This method is the complement to `Option.fromNullable`.  It converts `Some(x)`
to `x` and `None()` to undefined.

**`[...before, ...m, ...after]`**

The `Option` and `Result` types support the iterator protocol; `Some(x)` and
`Ok(x)` yield one item, and `None()` and `Err(e)` yield no items.  This allowes
optional values to be easily spliced into arrays.

### Testing Option an Result values

**`isOption(m)`** (alias: `Option.isOption`)<br/>
**`isResult(m)`** (alias: `Result.isResult`)

Tests whether `m` is an instance of `Option` (i.e. `Some` or `None`) or `Result`
(i.e. `Ok` or `Err`), respectively.

**`m.isSome()`**<br/>
**`m.isNone()`**<br/>
**`m.isOk()`**<br/>
**`m.isErr()`**

Tests whether `m` is an instance of `Some`, `None`, `Ok`, or `Err`,
respectively.

**`m.isSomeAnd(p)`**<br/>
**`m.isOkAnd(p)`**<br/>
**`m.isErrAnd(p)`**

Tests whether `m` is an instance of `Some`, `Ok`, or `Err`, respectively and its
contained value satisfies the predicate `p`.

### Transforming Option and Result values

**`m.map(f)`**

Analogous to `Array.map`; applies `f` to transform the the inner value of a
`Some` or `Ok` according to the following rules:

* `Some(x)` ↦ `Some(f(x)))`
* `Ok()` ↦ `Ok(f(x())`
* `None()` ↦ `None()`
* `Err(e)` ↦ `Err(e)`

**`m.andThen(f)`**<br/>
**`m.flatMap(f)`**

Analogous to `Array.flatMap`; applies `f` to transform the the inner value of a
`Some` or `Ok` according to the following rules:

* `Some(x)` ↦ `f(x)`
* `Ok()` ↦ `f(x)`
* `None()` ↦ `None()`
* `Err(e)` ↦ `Err(e)`

**`m.mapNullable(f)`** (`Option` only)

Similar to `map`, except when `f` returns `undefined` or `null`.  Obeys the
following rules:

* `Some(x)` ↦ `Some(f(x))` if `f(x) != null`
* `Some(x)` ↦ `None()` if `f(x) == null`
* `None()` ↦ `None()`



## Changes from Rust

- All names use `camelCase` to follow JavaScript conventions.
- Methods that panic in Rust throw errors.
- Many type signatures are loosened to take advantage of TypeScript union types.
- The constructors `Some`, `None`, `Ok`, and `Err` are top-level functions.
- Each constructor has a corresponding type. The methods on the constructor
  types have more precise signatures than those declared on `Option` and
  `Result`.
- Values of type `Some` and `Ok` allow direct access to their inner value via
  their `value` field; values of type `Err` likewise have an `error` field.
- Methods like `copied` and `cloned`, which are specific to Rust's type system,
  have been omitted.

### Functions not in Rust

- The top-level `Some`, `None`, `Ok`, and `Err` functions have corresponding
  funtions with more precised signatured named `constSome`, `constNone`,
  `constOk`, and `constErr`.
- There are top-level type predicates, `isOption` and `isResult`.
- The function `Option.fromNullable` function converts null and undefined values to `None()`;
  the `Option.toNullable` method performs the roughly inverse operation and is a shorthand for
  `o.unwrapOr(undefined)`.
- The `Result.try` function converts exceptions to `Err` values; it is roughly
  the inverse of `r.unwrap()`.
- The `Result.fromPromise` function and `Result.toPromise` method allow easy
  between representing an error as a rejected promise or promise resolved to as
  `Err` value.
- The `andThen` methods are aliased as `flatMap` for consistency with JavaScript
  APIs.

### Changed Methods

- The `expect` and `expectErr` methods can accept a function returning a string
  in addition to a plain string.
- The `unwrap` and `unwrapErr` methods can accept a optional nullary function to
  create the error value to be thrown on failure.
- `Err.unwrap` will throw its error value by default.
- Instead of an `iter` method, `Option` and `Result` use the JavaScript iterable
  protocol.



## Alternatives
* [@hoganassessments/maybe-ts](https://www.npmjs.com/package/@hoganassessments/maybe-ts) - no README
* [@jeppech/results-ts](https://www.npmjs.com/package/@jeppech/results-ts) - Rust-like, uses snake_case
* [@nextcapital/maybe](https://www.npmjs.com/package/@nextcapital/maybe) - more like a Result type
* [@pacote/option](https://www.npmjs.com/package/@pacote/option) - function-style interface
* [@sweet-monads/maybe](https://www.npmjs.com/package/@sweet-monads/maybe) - has `mapNullable`, missing `toNullable`
* [@yafu/maybe](https://www.npmjs.com/package/@yafu/maybe) - no docs, weird API
* [eithermaybe.ts](https://www.npmjs.com/package/eithermaybe.ts) - function-style interface, no `fromNullable`
* [maybe-monada](https://www.npmjs.com/package/maybe-monada) - Haskell-style with some Rust methods, no types
* [maybe](https://www.npmjs.com/package/maybe) - very few methods, no types
* [maybeasy](https://www.npmjs.com/package/maybeasy) - `fromNullable` is broken!
* [option-t](https://www.npmjs.com/package/option-t) - no types
* [ts-opt](https://www.npmjs.com/package/ts-opt) - very comprehensive
* [ts-result-es](https://www.npmjs.com/package/ts-results-es) - fork of ts-result with a few additions
* [ts-results-intraloop-fork](https://www.npmjs.com/package/ts-results-intraloop-fork)
* [ts-results](https://www.npmjs.com/package/ts-results)- Rust-like, no `fromNullable`
* [typescript-monads](https://www.npmjs.com/package/typescript-monads) - pretty good API but method names are clunky

### Uninteresting Forks
* [monads-io](https://www.npmjs.com/package/monads-io) - wrapper around sweet-monads
- [@casperlabs/ts-results](https://www.npmjs.com/package/@casperlabs/ts-results)
- [@wunderwerk/ts-results](https://www.npmjs.com/package/@wunderwerk/ts-results)
- [@zondax/ts-results](https://www.npmjs.com/package/@zondax/ts-results)
- [enhanced-ts-results](https://www.npmjs.com/package/enhanced-ts-results)
