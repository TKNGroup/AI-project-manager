// @ts-check

import { defineConfig, globalIgnores } from "eslint/config";

import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import perfectionist from "eslint-plugin-perfectionist";
// import eslintPluginNeverthrow from "eslint-plugin-neverthrow";

import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores(["dist", "bundle", ".vscode", "node_modules"]),
  {
    plugins: {
      unicorn,
      perfectionist,
      "unused-imports": unusedImports,
      // eslintPluginNeverthrow,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // typescript-eslint rules
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "none",
          caughtErrors: "none",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/member-ordering": [
        "warn",
        {
          classes: [
            "public-static-field",
            "protected-static-field",
            "private-static-field",

            "public-decorated-field",
            "protected-decorated-field",
            "private-decorated-field",

            "public-instance-field",
            "protected-instance-field",
            "private-instance-field",

            "public-abstract-field",
            "protected-abstract-field",

            "public-field",
            "protected-field",
            "private-field",

            "constructor",

            ["public-get", "public-set"],
            ["protected-get", "protected-set"],
            ["private-get", "private-set"],

            "public-decorated-method",
            "public-method",
            "protected-decorated-method",
            "protected-method",
            "private-decorated-method",
            "private-method",

            "public-abstract-method",
            "protected-abstract-method",
          ],
        },
      ],
      "@typescript-eslint/no-floating-promises": ["off"],
      "@typescript-eslint/require-await": ["off"],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: false,
          allowDirectConstAssertionInArrowFunctions: false,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-parameter-properties": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/ban-ts-comment": "warn",

      // unicorn
      "unicorn/no-await-expression-member": "error",
      "unicorn/prefer-node-protocol": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/better-regex": "error",
      "unicorn/catch-error-name": "error",
      "unicorn/prefer-number-properties": "error",

      // perfectionist
      // 'perfectionist/sort-classes': ['error', { type: 'natural' }],
      "perfectionist/sort-exports": ["error", { type: "natural" }],
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          type: "natural",
          internalPattern: ["@aipm", "@common"],
        },
      ],
      "perfectionist/sort-named-exports": ["error", { type: "natural" }],
      "perfectionist/sort-named-imports": ["error", { type: "natural" }],
      "perfectionist/sort-decorators": ["error", { type: "natural" }],

      // unused-imports rules
      "unused-imports/no-unused-imports": "error",

      // lint rules
      "no-duplicate-imports": "error",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
        {
          blankLine: "always",
          prev: "*",
          next: "if",
        },
        {
          blankLine: "always",
          prev: "*",
          next: "for",
        },
      ],
    },
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
]);
