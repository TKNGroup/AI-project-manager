import path from "path";

import dotenv from "dotenv";

import { envConfigSchema } from "./env-config.schema";

const envConfigPath = path.join(process.cwd(), ".env");

const envConfigRaw = dotenv.config({
  path: envConfigPath,
  quiet: true,
}).parsed;

if (envConfigRaw === undefined) {
  console.error("Failed to process dotenv.config");

  process.exit(1);
}

export const envConfig = envConfigSchema.parse({
  host: envConfigRaw["HOST"],
  port: envConfigRaw["PORT"],

  logger: {
    level: envConfigRaw["LOGGER_LEVEL"],
  },
});
