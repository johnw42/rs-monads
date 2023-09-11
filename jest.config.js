module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "/.*\\.test\\.ts$",
  // transform: {
  //   "^.+\\.tsx?$": "ts-jest",
  // },
};
