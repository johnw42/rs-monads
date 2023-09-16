import { Identity } from "./Identity";
import { Option } from "./Option";
import { Result } from "./Result";

export * from "./Identity";
export * from "./Option";
export * from "./Result";

/**
 * Combination of {@link Identity.unwrapValues}, {@link Option.unwrapValues},
 * and {@link Result.unwrapValues}.
 */
export function unwrapValues<
  T,
  M extends Identity<T> | Option<T> | Result<T, unknown>,
>(seq: Iterable<M>): T[] {
  const items: T[] = [];
  for (const m of seq) {
    if (m.hasValue()) {
      items.push(m.value);
    }
  }
  return items;
}
