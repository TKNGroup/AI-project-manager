import { CommandBus } from "./bus/command-bus";
import { INGEST_GROUP_MESSAGE } from "./commands/ingest-group-message.command";
import { createIngestGroupMessageHandler } from "./handlers/ingest-group-message.handler";

import type { PublishTelegramMessageEvent } from "../messaging/publish-telegram-message-event";
import type { Logger } from "@common/logger";

export type CreateCommandBusDeps = {
  logger: Logger;
  publishTelegramMessageEvent: PublishTelegramMessageEvent;
};

export function createCommandBus(deps: CreateCommandBusDeps): CommandBus {
  const bus = new CommandBus();

  bus.register(
    INGEST_GROUP_MESSAGE,
    createIngestGroupMessageHandler({
      logger: deps.logger,
      publishTelegramMessageEvent: deps.publishTelegramMessageEvent,
    }),
  );

  return bus;
}
