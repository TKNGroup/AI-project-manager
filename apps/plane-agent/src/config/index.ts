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

  nats: {
    url: envConfigRaw["NATS_URL"],
  },

  plane: {
    baseUrl: envConfigRaw["PLANE_BASE_URL"],
    apiKey: envConfigRaw["PLANE_API_KEY"],
    workspaceSlug: envConfigRaw["PLANE_WORKSPACE_SLUG"],
    projectId: envConfigRaw["PLANE_PROJECT_ID"],
    webhookUrl: envConfigRaw["PLANE_WEBHOOK_URL"],
  },
});
