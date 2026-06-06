import { Logger } from "@common/logger";
import { type NodeEnv } from "@common/shared";

import { bootstrapBot } from "./bot/create-bot";
import { envConfig } from "./config";
import { commandBusFactory } from "./cqrs/create-command-bus";
import { createTelegramMessageEventPublisher as publishTelegramMessageEventFactory } from "./messaging/publish-telegram-message-event";
import { bootstrapNatsConnection } from "./tranposrt/nats";

const NODE_ENV: NodeEnv =
  process.env["NODE_ENV"] === undefined
    ? "development"
    : (process.env["NODE_ENV"] as NodeEnv);

const appLogger = Logger.new(
  NODE_ENV,
  envConfig.logger.level,
  "aipm/telegram-agent",
);

appLogger.info("starting");

process.on("unhandledRejection", (rejection) => {
  appLogger.fatal(rejection, "unhandled rejection");
});

process.on("uncaughtException", (exception) => {
  appLogger.fatal(exception, "uncaught exception");
});

const natsConnection = await bootstrapNatsConnection(
  envConfig.nats.host,
  envConfig.nats.port,
  appLogger,
);

const publishTelegramMessageEvent =
  publishTelegramMessageEventFactory(natsConnection);

const commandBus = commandBusFactory({
  propsLogger: appLogger,
  publishTelegramMessageEvent: publishTelegramMessageEvent,
});

// send message

// send confirm message ~ сообщение с двумя кнопками: подтвердить / отклонить

type ConfirmMessageRequest = {
  id: string;
  chatId: string;
  text: string; // добавляю задачу "сосали?"
};

void (await bootstrapBot({
  token: envConfig.botToken,
  propsLogger: appLogger,
  commandBus: commandBus,
}));
