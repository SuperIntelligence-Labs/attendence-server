import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "warn",
      "quotes": ["warn", "double", { avoidEscape: true }],
      "semi": ["warn", "always"],
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-var-requires": "error",
      "no-import-assign": "error",
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "warn",
      "quotes": ["warn", "double", { avoidEscape: true }],
      "semi": ["warn", "always"],
      "no-fallthrough": "error",
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
]);
