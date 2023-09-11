const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");
const typescript = require("rollup-plugin-typescript2");
const pkg = require("./package.json");
const path = require("node:path");

module.exports = {
  input: ["src/index.ts"],
  output: [
    {
      dir: path.dirname(pkg.main),
      format: "cjs",
    },
    {
      dir: path.dirname(pkg.module),
      format: "es",
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
    }),
  ],
};
