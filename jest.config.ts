import type { Config } from 'jest';


const config: Config = {
  collectCoverage: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/.*\\.test\\.ts$",
};

export default config;