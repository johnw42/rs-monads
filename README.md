# rs-opt

This package contains based heavily on Rust's `Option` and `Result` types.  Why
use copy Rust APIs?  Aside from familiarity to Rust developers, I just like the
way the Rust API is designed and I find the method names regular enough that
it's easy to remember most of the based on a few patterns.

## Changes from Rust

### General Changes

- All names use `camelCase` to follow JavaScript conventions.
- Methods that panic in Rust throw errors.
- Many type signatures are loosened to take advantage of TypeScript union types.
- The constructors `Some`, `None`, `Ok`, and `Err` are top-level functions.
- Each constructor has a corresponding type.  In addition to the generic method
  signatures provided by `Option` and `Result`, the methods on the contructor
  types are narrowed to more precise signatures.

### New Methods


## Alternatives
* [@hoganassessments/maybe-ts](https://www.npmjs.com/package/@hoganassessments/maybe-ts) - no README
* [@jeppech/results-ts](https://www.npmjs.com/package/@jeppech/results-ts) - Rust-line, uses snake_case
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
