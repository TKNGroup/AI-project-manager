import { Logger } from "@common/logger";
import { type NodeEnv } from "@common/shared";

import { envConfig } from "./config";
import { NatsEventListener } from "./events/nats-event-listener";

const NODE_ENV: NodeEnv =
  process.env["NODE_ENV"] === undefined
    ? "development"
    : (process.env["NODE_ENV"] as NodeEnv);

const logger = Logger.new(NODE_ENV, envConfig.logger.level, "aipm/core");

logger.info("starting");

const natsEventListener = new NatsEventListener(logger, envConfig.nats.url);

await natsEventListener.connect();
await natsEventListener.subscribe("aipm.events.plane", async (payload) => {
  logger.info({ event: payload }, "plane event received");
});

process.on("unhandledRejection", (rejection) => {
  logger.fatal(rejection, "unhandled rejection");
});

process.on("uncaughtException", (exception) => {
  logger.fatal(exception, "uncaught exception");
});

process.on("SIGINT", () => {
  natsEventListener.close();
  process.exit(0);
});
