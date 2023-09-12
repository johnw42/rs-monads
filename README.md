# rs-opt

This package contains based heavily on Rust's `Option` and `Result` types.  Why
use copy Rust APIs?  Aside from familiarity to Rust developers, I just like the
way the Rust API is designed and I find the method names regular enough that
it's easy to remember most of the based on a few patterns.

## General Overview

The main types in this package are `Option` and `Result`.  Each of these types
is also a namespace containining important functions and subtypes.  Most symbols
defined in these namespaces are also available as top-level imports.

## Changes from Rust

- All names use `camelCase` to follow JavaScript conventions.
- Methods that panic in Rust throw errors.
- Many type signatures are loosened to take advantage of TypeScript union types.
- The constructors `Some`, `None`, `Ok`, and `Err` are top-level functions.
- Each constructor has a corresponding type.  The methods on the constructor
  types have more precise signatures than those declared on `Option` and
  `Result`.
- Values of type `Some` and `Ok` allow direct access to their inner value via
  their `value` field; values of type `Err` likewise have an `error` field.
- Methods like `copied` and `cloned`, which are specific to Rust's type system,
  have been omitted.

## Functions not in Rust

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

## Changed Methods

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
