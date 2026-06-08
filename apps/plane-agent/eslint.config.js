import { defineConfig } from "eslint/config";

import baseConfig from "@common/eslint/base.js";

export default defineConfig([
  {
    extends: [baseConfig],
  },
  {
    files: ["**/*.{ts}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
          allowDirectConstAssertionInArrowFunctions: false,
          allowedNames: [],
          allowExpressions: true,
          allowFunctionsWithoutTypeParameters: true,
          allowHigherOrderFunctions: true,
          allowIIFEs: true,
          allowTypedFunctionExpressions: true,
        },
      ],
    },
  },
]);
