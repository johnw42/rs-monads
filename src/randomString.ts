const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~";

/**
 * Gets a random string of the given length suitable for use as a code verifier.
 */
export function randomString(length: number) {
  let s = "";
  while (s.length < length) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}
