# rs-monads

This package contains types based heavily on Rust's main monad types: `Option`
and `Result`. It also adds methods from the popular `tap` crate. Why use copy
Rust APIs? Aside from familiarity to Rust developers, I just like the way the
Rust API is designed and I find the method names regular enough that it's easy
to remember most of them based on a few patterns.

- [rs-monads](#rs-monads)
  - [A Motivating Example](#a-motivating-example)
  - [Types Defined by This Package](#types-defined-by-this-package)
  - [Important Functions and Methods](#important-functions-and-methods)
    - [Creating instances](#creating-instances)
    - [Extracting the contents of monad instances](#extracting-the-contents-of-monad-instances)
    - [Working with nullable values](#working-with-nullable-values)
    - [Testing monad instances](#testing-monad-instances)
    - [Transforming monad instances](#transforming-monad-instances)
    - [Side Effects](#side-effects)
    - [Manipulating collections of monad instances](#manipulating-collections-of-monad-instances)
    - [Converting between exceptions, promises and `Result`](#converting-between-exceptions-promises-and-result)
  - [Recipes](#recipes)
    - [Convert truthy values to `Some` and falsy values to `None`](#convert-truthy-values-to-some-and-falsy-values-to-none)
    - [Convert `NaN` values to `None`](#convert-nan-values-to-none)
    - [Map a function that returns `null` or `undefined` to indicate a missing result](#map-a-function-that-returns-null-or-undefined-to-indicate-a-missing-result)
    - [Unwrap all values in an array](#unwrap-all-values-in-an-array)
  - [Alternatives](#alternatives)
    - [Uninteresting Forks](#uninteresting-forks)


## A Motivating Example

JavaScript's `?.` operator makes it easy to conditionally call methods when the
receiver may be `null` or `undefined` and the methods themselves may return
`undefined` or `null`:

```ts
function pipeline(a: A | undefined): D | undefined {
  return a?.convertToB().convertToC()?.convertToD();
}
```

But what if we're using functions instead of methods? Consider these three functions:

```ts
function convertAToB(a: A): B  {...}
function convertBToC(b: B): C | null {...}
function convertCToD(c: C): D | undefined {...}
```

Chaining them together can get very ugly, (althogh at least logging intermediate
results is convenient):

```ts
function pipeline1(a: A | undefined): D | undefined {
  if (a === undefined) {
    return undefined;
  }
  const b = convertAToB(a);
  const c = convertBToC(b);
  console.log("After converting to C:", c);
  if (c === null) {
    return undefined;
  }
  const d = convertCToD(c);
  return d;
}
```

But with the `Option` type, it looks a lot more like calling a series of methods
with the `?.` operator, and it's even still easy to do things like log
intermediate results:

```ts
function pipeline2(a: A | undefined): D | undefined {
  return fromNullable(a)
    .map(convertAToB)
    .map(convertBToC)
    .nonNullable()
    .tap((c) => console.log("After converting to C:", c))
    .map(convertCToD)
    .nonNullable()
    .toNullable();
}
```

## Types Defined by This Package

---
**`Option<T> = Option.Some<T> | Option.None<T>`**

A type that may or may not contain a value of type `T`. `Option.Some<T>` contains a
value and `Option.None<T>` does not. These subtypes are also aliased as
`Some<T>` and `None<T>`.

---
**`Result<T,E> = Result.Ok<T,E> | Result.Err<T,E>`**

An instnace type `Result.Ok<T,E>`, which contains a value of type `T`, or an
instance of `Result.Err<T,E>`, which contains an error value of type `E`. These
subtypes are also aliased as `Ok<T,E>` and `Err<T,E>`.


## Important Functions and Methods

This is not a comprehensive list; see the source code or the generated `.d.ts`
files for complete documentation. Functions marked with a star (★) are also
available as top-level imports. The variable `m` represents an arbitrary
instance of a monad type.

### Creating instances

---
**`Option.Some(x)`** ★  
**`Option.None()`** ★  
**`Result.Ok(x)`** ★  
**`Result.Err(e)`** ★  

Creates an object of the specified type holding the given value.

---
**`Option.constSome(x)`** ★  
**`Option.constNone(x)`** ★  
**`Option.constOk(x)`** ★  
**`Option.constErr(e)`** ★

Alternate versions of the similarly-named functions above with a more precise
return type suitable for intializing constants.

---
**`Option.fromNullable(x)`** ★  

A shorthand for `Some(x).nonNullable()` (decribed below).

---


### Extracting the contents of monad instances

---
**`m.unwrap()`**  
**`m.expect("m should have a value")`**

If `m` is has a non-error value, returns `m.value`, otherwise throws an error.
If `m` is `Err(e)`, `unwrap` throws `e`.

---
**`m.unwrapOr(def)`**  
**`m.unwrapOrElse(lazyDef)`**

If `m` has a non-error value, returns `x.value`, otherwise returns `def` or
`lazyDef()`.

---
**`[...before, ...m, ...after]`**

The monad types support the iterator protocol; `Some(x)` and `Ok(x)`, and
`None()` and `Err(e)` yield no items. This allows optional values to be easily
spliced into arrays.

---
**Some(x).value**  
**Ok(x).value**  
**Err(e).error**

These fields hold `x` or `e`. They are only defined on the relevant subclasses
of `Option` and `Result`.


### Working with nullable values

Many Javascript APIs use `null` or `undefined` to indicate the absence of a
value, leading to what TypeScript calls nullable types.  Generally speaking,
`Option` has a richer set of methods than `Result` for dealing with nullable
types, because `Option` models the same scenarios as nullable types.

---
**m.nonNullable()**  
**m.nonNullableOr(def)**  
**m.nonNullableOrElse(orElse)**  

Converts `Some(x)` to `None()` when `x` is `null` or `undefined`.  Likewise
converts `Ok(x)` to `Err(def)` or `Err(lazyDef())`.  `None` or `Err` instances
are returned unchanged.

---
**`m.toNullable()`**
**`m.unwrapOrUndef()`**  

These synonymous `Option` methods are the complement to `fromNullable`. They are
equivalent to `m.unwrapOr(undefined)`. To get the same effect with a result, use
`m.ok().toNullable()`.

---
**Option.fromNullable(x)** ★

Shortand to `Some(x).nonNullable()`. To produce `Result` instances with a
default error value, use one of the following patterns:

- `fromNullable(x).okOr(def)`
- `fromNullable(x).okOrElse(lazyDef)`.
- `Ok(x).nonNullableOr(def, x)`
- `Ok(x).nonNullableOrElse(lazyDef, x)`.


### Testing monad instances

---
**`Option.isOption(m)`** ★  
**`Option.isOk(m)`** ★  
**`Option.isNone(m)`** ★  
**`Result.isResult(m)`** ★  
**`Result.isOk(m)`** ★  
**`Result.isErr(m)`** ★  

Tests whether `m` is an instance of the corresponding type.

---
**`m.isSome()`**  
**`m.isNone()`**  
**`m.isOk()`**  
**`m.isErr()`**

Tests whether `m` is an instance of the corresponding type.

---
**`m.isSomeAnd(p)`**  
**`m.isOkAnd(p)`**  
**`m.isErrAnd(p)`**  

Tests whether `m` is an instance of the corresponding type whose value
statisifes the predicate `p`.

---
**`m1.equals(m1)`**  
**`m1.equals(m1, cmp)`** (for `Option`)  
**`m1.equals(m1, cmpValues, cmpErrors)`** (for `Result`)

Tests whether two instances are equal. With a single argument, monads of the
same basic type (`Option`, `Result`) are compared recursively,
and contained values are compared with `===`.

Additional arguments are binary predicates applied to the contents of the monad
instances to determine equality. `cmp` and `cmpValues` are used to compare
`value` fields of instances, and `cmpError` is used to compare the `error`
fields of `Error` instances.

---
**`Option.equals(x, y, [cmp])`**  
**`Result.equals(x, y, [cmpValues, [cmpErrors]])`**

These functions are the same as the methods above, but they accept values of any
type and return `false` if the values are not instances of the correct monad
type.


### Transforming monad instances

---
**`m.map(f)`**

Analogous to `Array.map`; applies `f` to transform the the inner value of a
`Some` or `Ok` according to the following rules:

- `Some(x)` ↦ `Some(f(x)))`
- `Ok()` ↦ `Ok(f(x())`
- `None()` ↦ `None()`
- `Err(e)` ↦ `Err(e)`

---
**`m.andThen(f)`**  
**`m.flatMap(f)`**

Analogous to `Array.flatMap`. These synonymous methods apply `f` to transform
the the inner value of a `Some` or `Ok` according to the following rules:

- `Some(x)` ↦ `f(x)`
- `Ok()` ↦ `f(x)`
- `None()` ↦ `None()`
- `Err(e)` ↦ `Err(e)`

---
**`m.mapOr(def, f)`**  
**`m.mapOrElse(lazyDef, f)`**  
**`m.mapOrUndef(f)`**

These methods are shorthands for `m.mapOr(f).unwrapOr(def)`,
`m.mapOrElse(f).unwrapOr(lazyDef)`, and `m.mapOrUndef(f).unwrapOrUndef()`,
respectively.


### Side Effects

---
**`m.tap(f)`**

This method calls `f(m)`. Use this function to "tap into" a sequences of
operations to do something like log an intermediate value:

```ts
return m
  .map(tranformation)
  .tap((m) => console.log(m))
  .map(anotherTranformation);
```

This method calls `f(m)`. Use this function to "tap into" a sequences of
operations to do something like log an intermediate value:

---
**`m.tapSome(f)`**  
**`m.tapOk(f)`**  

These specialized versions of `tap` call `f(m.value)` for its side effects if
`m` has a non-error value.

---
**`m.tapNoValue(f)`**
**`m.tapNone(f)`**  
**`m.tapErr(f)`**

Thse function call `f()` (or `f(m.error)` for `tapErr`) if `m` has no non-error value.


### Manipulating collections of monad instances

---
**`Option.collect(seq)`**  
**`Result.collect(seq)`**

Summarize a sequence of fallible computations, halting after the first error.
Given an iterable sequence of monad instances, collects values of `x` in
`Some(x)` or `Ok(x)` into an array. Iteration stops the first time a `None` or
`Err` instance is encountered, in which case it is returned, discarding the `x`
values. If iteration completes without encountering a `None` or `Err` instance,
an array of `x` values is returned, wrapped with `Some` or `Ok`.

The following code snippets are equivalent:

```ts
Option.collect(step1()).mapOrElse(() => console.log("step1 failed"), step2);
return;
```

```ts
const options = step1();
const values: ValueType[] = [];
try {
  for (const m of options) {
    results.push(m.unwrap());
  }
} catch (e) {
  console.log("step1 failed");
  return;
}
step2(values);
return;
```

---
**`Option.unwrapValues(seq)`** ★  
**`Result.unwrapValues(seq)`** ★  

These functions filter out the `None` or `Err` instances in their input sequence
and unwrap the remaining values into a new array. The roughly equivalent to
`Array.from(seq).flatMap(Array.from)`.

--- 
**`Result.unwrapErrs(seq)`** ★

Like `unwrapSomes`, but for `Err` instances.

---
**`Result.unwrapResults(seq)`** ★

Like `[unwrapOks(seq), unwrapErrs(seq)]`, but only makes one pass
over the input sequences.


### Converting between exceptions, promises and `Result`

---
**`Result.try(f)`**

Calls a function, capturing any throw exception as an `Err` instance. Its
inverse operation is `unwrap()`, such that `Result.try(f).unwrap()` is
equivalent to just `f()`.

The following snippets are also equivalent:

```ts
const r = Result.try(functionThatMayThrow);
console.log(r);
try {
  handleSuccess(r.unwrap());
} catch (e) {
  handleFailure(e);
}
if (r.isOk()) {
  doSomethingElse(r.value);
}
```

```ts
let x: TypeOfX | undefined;
try {
  x = functionThatMayThrow();
  console.log(`Ok(${x})`);
  handleSuccess(x);
} catch (e) {
  console.log(`Err(${e})`);
  handleFailure(e);
}
if (x !== undefined) {
  doSomethingElse(x);
}
```

---
**`Result.fromPromise(p)`** ★  
**`r.toPromise(q)`**

These two functions are inverses of each other. The first translates a promise
`p` to a new promise `q` that always resolves to a `Result` instance `r`. The
second translates a for a `Result` into a promise that resolves to or rejects
based on the subtype of `r`. These two functions are inverses, such that
`Result.fromPromise(p).then(r => r.toPromise())` is equivalent to just `p`.

The following two code snippets are also equivalent:

```ts
const r = await Result.fromPromise(asyncFunctionThatMayThrow());
console.log(r);
try {
  handleSuccess(await r.toPromise());
} catch (e) {
  handleFailure(e);
}
if (r.isOk()) {
  doSomethingElse(r.value);
}
```

```ts
let x: TypeOfX | undefined;
try {
  x = await asyncFunctionThatMayThrow();
  console.log(`Ok(${x})`);
  handleSuccess(x);
} catch (e) {
  console.log(`Err(${e})`);
  handleFailure(e);
}
if (x !== undefined) {
  doSomethingElse(x);
}
```

## Recipes

### Convert truthy values to `Some` and falsy values to `None`

`Some(x).filter(Boolean)`


### Convert `NaN` values to `None`

`Some(x).filter((x) => !Number.isNaN(x))`


### Map a function that returns `null` or `undefined` to indicate a missing result

`m.map(f).nonNullable()` (for `Option`)
`m.map(f).nonNullableOr(def, f)` (for `Result`)
`m.map(f).nonNullableOrElse(lazyDef, f)` (for `Result`)


### Unwrap all values in an array

`[Some(x), None()].flatMap(y => [...y])`  ↦ `[x]`

Using `Array.from` as the argument to `flapMap` won't work because of the extra
arguments it passes to `Array.from`.



## Alternatives

- [@hoganassessments/maybe-ts](https://www.npmjs.com/package/@hoganassessments/maybe-ts) - no README
- [@jeppech/results-ts](https://www.npmjs.com/package/@jeppech/results-ts) - Rust-like, uses snake_case
- [@nextcapital/maybe](https://www.npmjs.com/package/@nextcapital/maybe) - more like a Result type
- [@pacote/option](https://www.npmjs.com/package/@pacote/option) - function-style interface
- [@sweet-monads/maybe](https://www.npmjs.com/package/@sweet-monads/maybe) - has `mapNullable`, missing `toNullable`
- [@yafu/maybe](https://www.npmjs.com/package/@yafu/maybe) - no docs, weird API
- [eithermaybe.ts](https://www.npmjs.com/package/eithermaybe.ts) - function-style interface, no `fromNullable`
- [maybe-monada](https://www.npmjs.com/package/maybe-monada) - Haskell-style with some Rust methods, no types
- [maybe](https://www.npmjs.com/package/maybe) - very few methods, no types
- [maybeasy](https://www.npmjs.com/package/maybeasy) - `fromNullable` is broken!
- [option-t](https://www.npmjs.com/package/option-t) - no types
- [ts-opt](https://www.npmjs.com/package/ts-opt) - very comprehensive
- [ts-result-es](https://www.npmjs.com/package/ts-results-es) - fork of ts-result with a few additions
- [ts-results-intraloop-fork](https://www.npmjs.com/package/ts-results-intraloop-fork)
- [ts-results](https://www.npmjs.com/package/ts-results)- Rust-like, no `fromNullable`
- [typescript-monads](https://www.npmjs.com/package/typescript-monads) - pretty good API but method names are clunky

### Uninteresting Forks

- [monads-io](https://www.npmjs.com/package/monads-io) - wrapper around sweet-monads
- [@casperlabs/ts-results](https://www.npmjs.com/package/@casperlabs/ts-results)
- [@wunderwerk/ts-results](https://www.npmjs.com/package/@wunderwerk/ts-results)
- [@zondax/ts-results](https://www.npmjs.com/package/@zondax/ts-results)
- [enhanced-ts-results](https://www.npmjs.com/package/enhanced-ts-results)
