import path from "path";

import dotenv from "dotenv";

import { envConfigSchema } from "./env-config.schema";

const packageRoot = path.resolve(import.meta.dir, "..", "..");
const envConfigPath = path.join(packageRoot, ".env");

const envConfigRaw = dotenv.config({
  path: envConfigPath,
  quiet: true,
}).parsed;

if (envConfigRaw === undefined) {
  console.error(`Failed to load .env`);

  process.exit(1);
}

export const envConfig = envConfigSchema.parse({
  host: envConfigRaw["HOST"],
  port: envConfigRaw["PORT"],
  botToken: envConfigRaw["BOT_TOKEN"],
  nats: {
    host: envConfigRaw["NATS_HOST"],
    port: envConfigRaw["NATS_PORT"],
  },
  logger: {
    level: envConfigRaw["LOGGER_LEVEL"],
  },
});
