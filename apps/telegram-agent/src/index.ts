import { Logger } from "@common/logger";
import { type NodeEnv } from "@common/shared";

import { createBot } from "./bot/create-bot";
import { envConfig } from "./config";
import { createCommandBus } from "./cqrs/create-command-bus";
import { connectNats } from "./messaging/nats-client";
import { createTelegramMessageEventPublisher } from "./messaging/publish-telegram-message-event";

const NODE_ENV: NodeEnv =
  process.env["NODE_ENV"] === undefined
    ? "development"
    : (process.env["NODE_ENV"] as NodeEnv);

const logger = Logger.new(
  NODE_ENV,
  envConfig.logger.level,
  "aipm/telegram-agent",
);

logger.info("starting");

process.on("unhandledRejection", (rejection) => {
  logger.fatal(rejection, "unhandled rejection");
});

process.on("uncaughtException", (exception) => {
  logger.fatal(exception, "uncaught exception");
});

let nc;

try {
  nc = await connectNats(envConfig, logger);
} catch (error) {
  logger.fatal(
    error,
    "cannot connect to nats — start docker (make up) and run nats migration",
  );

  process.exit(1);
}

const publishTelegramMessageEvent = createTelegramMessageEventPublisher(nc);
const commandBus = createCommandBus({ logger, publishTelegramMessageEvent });
const bot = createBot({
  token: envConfig.botToken,
  logger,
  commandBus,
});

await bot.launch();

logger.info(
  { loggerLevel: envConfig.logger.level },
  "telegram bot launched (waiting for messages)",
);

process.once("SIGINT", () => {
  void bot.stop("SIGINT");
  void nc.close();
});

process.once("SIGTERM", () => {
  void bot.stop("SIGTERM");
  void nc.close();
});
