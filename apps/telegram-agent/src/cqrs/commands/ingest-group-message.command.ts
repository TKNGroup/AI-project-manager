import {
  type Command,
  type CommandHandler,
  type InferCommandResult,
} from "@common/cqrs";
import { type Logger } from "@common/logger";
import { type ApiError, type ApiResult } from "@common/shared";

import { type PublishTelegramMessageEvent } from "../../messaging/publish-telegram-message-event";
import { type TelegramMessageEvent } from "../../telegram/telegram-message-event";

export const INGEST_GROUP_MESSAGE = "ingest.group.message";

export type IngestGroupMessageCommand = Command<
  "ingest.group.message",
  TelegramMessageEvent,
  ApiResult<never, ApiError<"internal">>
>;

export type IngestGroupMessageHandlerDeps = {
  propsLogger: Logger;
  publishTelegramMessageEvent: PublishTelegramMessageEvent;
};

export function ingestGroupMessageCommandHandlerFactory(
  deps: IngestGroupMessageHandlerDeps,
): CommandHandler<IngestGroupMessageCommand> {
  return async (
    command: IngestGroupMessageCommand,
  ): Promise<InferCommandResult<IngestGroupMessageCommand>> => {
    const logger = deps.propsLogger
      .stack("command#ingest.group.message")
      .child(command.meta);

    try {
      await deps.publishTelegramMessageEvent(command.payload);

      logger.trace(command.payload, "telegram message event published to nats");

      return {
        ok: true,
      };
    } catch (error) {
      logger.unexpectedError(error);

      return {
        ok: false,
        error: {
          code: "internal",
        },
      };
    }
  };
}
