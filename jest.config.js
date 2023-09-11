module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 100,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/.*\\.test\\.ts$",
};
