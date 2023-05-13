export const RANDOM_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~";

/**
 * Gets a random string of the given length suitable for use as a code verifier.
 */
export function randomString(length: number) {
  let s = "";
  while (s.length < length) {
    s += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
  }
  return s;
}
