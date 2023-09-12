module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageThreshold: {
    global: {
      lines: 100,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/.*\\.test\\.ts$",
};
