/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/tests/backend/**/*.test.js", "**/tests/api/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: ["utils/syakirahUtil.js"],
  coverageDirectory: "coverage/backend",
  coverageReporters: ["text", "html", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80,
    },
  },
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
};
