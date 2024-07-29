// @ts-check
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json"],
        tsconfigRootDir: import.meta.dirname || __dirname,
      },
    },
  },
  {
    ignores: [
      ".coverage_artifacts",
      ".coverage_cache",
      ".coverage_contracts",
      "artifacts",
      "build",
      "cache",
      "coverage",
      "dist",
      "node_modules",
      "typechain-types",
      ".solcover.js",
      "eslint.config.mjs",
    ],
  },
);
