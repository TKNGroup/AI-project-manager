import { type PublishTelegramMessageEvent } from "../../messaging/publish-telegram-message-event";

import type { IngestGroupMessageCommand } from "../commands/ingest-group-message.command";
import type { CommandHandler } from "@common/cqrs";
import type { Logger } from "@common/logger";

export type IngestGroupMessageHandlerDeps = {
  logger: Logger;
  publishTelegramMessageEvent: PublishTelegramMessageEvent;
};

export function createIngestGroupMessageHandler(
  deps: IngestGroupMessageHandlerDeps,
): CommandHandler<IngestGroupMessageCommand> {
  return async (command: IngestGroupMessageCommand): Promise<void> => {
    const event = command.payload;

    await deps.publishTelegramMessageEvent(event);

    deps.logger.info(event, "telegram message event published to nats");
  };
}
