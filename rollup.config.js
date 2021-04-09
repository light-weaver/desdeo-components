import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss-modules";

import autoprefixer from "autoprefixer";

export default [
  {
    input: "./src/index.tsx",
    output: {
      file: "./lib/index.esm.js",
      format: "esm",
    },
    plugins: [
      typescript(),
      postcss({
        extract: true,
        plugins: [autoprefixer()],
      }),
    ],
  },
  {
    input: "./src/index.tsx",
    output: {
      file: "./lib/index.js",
      format: "cjs",
    },
    plugins: [
      typescript(),
      postcss({
        extract: true,
        plugins: [autoprefixer()],
      }),
    ],
  },
];
