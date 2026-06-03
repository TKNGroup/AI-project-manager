import { Logger } from "@common/logger";
import { type NodeEnv } from "@common/shared";

import { envConfig } from "./config";

const NODE_ENV: NodeEnv =
  process.env["NODE_ENV"] === undefined
    ? "development"
    : (process.env["NODE_ENV"] as NodeEnv);

const logger = Logger.new(
  NODE_ENV,
  envConfig.logger.level,
  "aipm/yandex-telemost-agent",
);

logger.info("starting");

process.on("unhandledRejection", (rejection) => {
  logger.fatal(rejection, "unhandled rejection");
});

process.on("uncaughtException", (exception) => {
  logger.fatal(exception, "uncaught exception");
});

// ...
