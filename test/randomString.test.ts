import { randomString } from "../src/randomString";

test("randomString", () => {
  for (let i = 0; i < 100; i++) {
    const length = Math.floor(50 + 50 * Math.random());
    const s = randomString(length);
    expect(s.length).toBe(length);
    expect(encodeURIComponent(s)).toBe(s);
  }
});