import { RANDOM_ALPHABET, randomString } from "../src/util";

describe("randomString", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("generates random strings", () => {
    const prime1 = 101;
    const prime2 = 127;

    let counter = 0;
    jest.spyOn(Math, "random").mockImplementation(() => {
      counter = (counter + 1) % prime1;
      return counter / prime1;
    });

    const charsSeen = new Set<string>();

    for (let i = 0; i < prime2; i++) {
      const length = Math.floor(50 + 50 * Math.random());
      const s = randomString(length);
      expect(s.length).toBe(length);
      expect(encodeURIComponent(s)).toBe(s);
      [...s].forEach((c) => charsSeen.add(c));
    }

    [...RANDOM_ALPHABET].forEach((c) => expect(charsSeen.has(c)).toBe(true));
    expect(charsSeen.size).toBe(RANDOM_ALPHABET.length);
  });
});
