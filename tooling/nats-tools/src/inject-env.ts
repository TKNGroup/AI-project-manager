import path from "path";

import { config } from "dotenv";

const envConfigPath = path.join(process.cwd(), ".env");

config({
  path: envConfigPath,
});
