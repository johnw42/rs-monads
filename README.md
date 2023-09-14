# rs-monads

This package contains types based heavily on Rust's main monad types: `Option`
and `Result`.  It also adds methods from the popular `tap` crate and a trivial
monad called `Identity`.  Why use copy Rust APIs?  Aside from familiarity to
Rust developers, I just like the way the Rust API is designed and I find the
method names regular enough that it's easy to remember most of them based on a
few patterns.



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
    .mapNullable(convertBToC)
    .tap(c => console.log("After converting to C:", c))
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


**`Identity`**

The trivial monad.  It is simply a box that holds a value.  Sometimes useful for
sequencing function calls as if they were methods.


## Important Functions and Methods

(This is not a comprehensive list; see the source code or the generated `.d.ts`
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


**`Identity(x)`**

Creates an `Identity` value containing `x`.


**`constSome(x)`** (alias: `Option.constSome`)  
**`constNone(x)`** (alias: `Option.constNone`)  
**`constOk(x)`** (alias: `Option.constOk`)  
**`constErr(e)`** (alias: `Option.constErr`)

Alternate versions of the similarly-named functions above with a more precise
return type suitable for intializing constants.


**`fromNullable(x)`** (alias: `Option.fromNullable`)  
**`fromNullableOr(def, x)`** (alias: `Result.fromNullableOr`)  
**`fromNullableOrElse(lazyDef, x)`** (alias: `Result.fromNullableOrElse`)  

Wraps the value `x` as `Some(x)` or `Ok(x)` unless `x` is `null` or `undefined`,
in which case it returns `None()`, `Err(der)` or `Err(lazyDef())`.


### Extracting the contents of monad values

**`m.unwrap()`**  
**`m.expect("m should have a value")`**

If `m` is `Some(x)` or `Ok(x)`, returns `x`, otherwise throws an error. If `m`
is `Err(e)`, `unwrap` throws `e`.


**`m.unwrapOr(def)`**  
**`m.unwrapOrElse(lazyDef)`**

If `m` is `Some(x)` or `Ok(x)`, returns `x`, otherwise returns `def`  or
`lazyDef()`.


**`m.unwrapOrUndef()`**  
**`m.toNullable()`**

These synonymous methods are the complement to `fromNullable`, `fromNullableOr`,
and `fromNullableOrElse`. They are equivalent to `m.unwrapOr(undefined)`.


**`[...before, ...m, ...after]`**

The monad types support the iterator protocol; `Some(x)` and `Ok(x)`, and
`Identity` yield one item, and `None()` and `Err(e)` yield no items.  This
allows optional values to be easily spliced into arrays.


**Identity(x).value**  
**Some(x).value**  
**Ok(x).value**  
**Err(e).error**  

These fields hold `x` or `e`.  They are only defined on the relevant subclasses
of `Option` and `Result`.


### Testing monad values

**`isOption(m)`** (alias: `Option.isOption`)  
**`isResult(m)`** (alias: `Result.isResult`)

Tests whether `m` is an instance of `Option` (i.e. `Some` or `None`) or `Result`
(i.e. `Ok` or `Err`), respectively.


**`m.isSome()`**  
**`m.isNone()`**  
**`m.isOk()`**  
**`m.isErr()`**

Tests whether `m` is an instance of `Some`, `None`, `Ok`, or `Err`,
respectively.


**`m.isSomeAnd(p)`**  
**`m.isOkAnd(p)`**  
**`m.isErrAnd(p)`**

Tests whether `m` is an instance of `Some`, `Ok`, or `Err`, respectively and its
contained value satisfies the predicate `p`.


### Transforming monad values

**`m.map(f)`**

Analogous to `Array.map`; applies `f` to transform the the inner value of a
`Some`, `Ok`, or `Identity` according to the following rules:

* `Some(x)` ↦ `Some(f(x)))`
* `Ok()` ↦ `Ok(f(x())`
* `None()` ↦ `None()`
* `Err(e)` ↦ `Err(e)`
- `Identity(x)` ↦ `Identity(f(x))`


**`m.andThen(f)`**  
**`m.flatMap(f)`**

Analogous to `Array.flatMap`. These synonymous methods apply `f` to transform
the the inner value of a `Some`, `Ok`, or `Identity` according to the following rules:

* `Some(x)` ↦ `f(x)`
* `Ok()` ↦ `f(x)`
* `None()` ↦ `None()`
* `Err(e)` ↦ `Err(e)`
* `Identity(x)` ↦ `f(x)`


**`m.pipe(f)`**

Returns `f(m)` unconditionally.  This is similar to `tap`, but `f` is called for
its return value rather than its side effects.


**`m.mapOr(def, f)`**  
**`m.mapOrElse(lazyDef, f)`**  
**`m.mapOrUndef(f)`**  

These methods are shorthands for `m.mapOr(f).unwrapOr(def)`,
`m.mapOrElse(f).unwrapOr(lazyDef)`, and `m.mapOrUndef(f).unwrapOrUndef()`,
respectively.


**`m.mapNullable(f)`**  
**`m.mapNullableOr(def, f)`**  
**`m.mapNullableOrElse(lazyDef, f)`**  

Similar to `map`, except when `f` returns `undefined` or `null`.  These methods
obey the following rules:

* `Some(x)` ↦ `Some(f(x))` if `f(x) != null`
* `Some(x)` ↦ `None()` if `f(x) == null`
* `None()` ↦ `None()`
* `Ok(x)` ↦ `Ok(f(x))` if `f(x) != null`
* `Ok(x)` ↦ `Err(def)` or `Err(lazyDef())` if `f(x) == null`
* `Err(e)` ↦ `Err(e)`


### Side Effects

**`m.tap(f)`**

This method calls `f(m)`. A typical use of these functions is insert logging
into a chain of calls:

```ts
return m
  .map(tranformation)
  .tap(m => console.log(m))
  .map(anotherTranformation)
```


**`m.tapValue(f)`**  
**`m.tapSome(f)`**  
**`m.tapNone(f)`**  
**`m.tapOk(f)`**  
**`m.tapErr(f)`**

These speciazed versions of `tap` call `f` for its side effects if `m` is
`Identity`, `Some`, `None`, `Ok`, or `Err`, respectively, passing in any value
they hold. They all return `m`.


### Converting between exceptions, promises and `Result`

**`Result.try(f)`**

Returns `Ok(x)` if `f()` returns `x` or `Err(e)` if `f()` throws `e`.


**`m.unwrap()`**

Returns `x` if `m` is `Ok(x)`; throws `e` if `m` is `Err(e)`.


**`fromPromise(p)`** (alias: `Result.fromPromise`)

Given a promise `p` that resolves to `x` or rejects with `e`, returns a promise
that resolves to `Ok(e)` or `Err(e)`.


**`m.toPromise()`**

If `m` is `Ok(x)`, returns a promise that resolves to `x`; if `m` is `Err(e)`,
returns a promise that rejects with `e`.



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
* [@casperlabs/ts-results](https://www.npmjs.com/package/@casperlabs/ts-results)
* [@wunderwerk/ts-results](https://www.npmjs.com/package/@wunderwerk/ts-results)
* [@zondax/ts-results](https://www.npmjs.com/package/@zondax/ts-results)
* [enhanced-ts-results](https://www.npmjs.com/package/enhanced-ts-results)
