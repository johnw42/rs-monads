export abstract class Tappable {
  /**
   * Calls `f(this)` for its side effect and returns `this`.
   *
   * This method is designed to be used as part of a series of chained method
   * calls to do things like log an intermediate value.  Think of the chain as a
   * pipeline and the name "tap" in the sense of "[on tap][1]""; it gives access to
   * values flowing through the pipeline without interfering with the overall
   * flow.
   * 
   * [1]: https://www.merriam-webster.com/dictionary/tap#on-tap
   */
  tap(f: (thisArg: this) => void): this {
    f(this);
    return this;
  }
}
