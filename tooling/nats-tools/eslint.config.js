import { defineConfig } from "eslint/config";

import baseConfig from "@common/eslint/base.js";

export default defineConfig([
  {
    extends: [baseConfig],
  },
]);
