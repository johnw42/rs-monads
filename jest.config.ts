import type { Config } from "jest";

const config: Config = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/.*\\.test\\.ts$",
};

export default config;
