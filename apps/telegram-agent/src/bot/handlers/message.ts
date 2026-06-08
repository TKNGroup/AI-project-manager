import { Command } from "@common/cqrs";
import { UUIDv7 } from "@common/shared";

import { INGEST_GROUP_MESSAGE } from "../../cqrs/commands/ingest-group-message.command";
import { TelegramMessageEvent } from "../../telegram/telegram-message-event";

import type { CommandBus } from "../../cqrs/bus/command-bus";
import type { Logger } from "@common/logger";
import type { Telegraf } from "telegraf";

export type MessageHandlerDeps = {
  propsLogger: Logger;
  commandBus: CommandBus;
};

export function registerMessageHandler(
  bot: Telegraf,
  deps: MessageHandlerDeps,
): void {
  const handlerLogger = deps.propsLogger.stack("telegram::event#message");

  bot.on("message", async (ctx) => {
    const logger = handlerLogger.addTraceId().child({
      chatId: ctx.message.chat.id,
      messageId: ctx.message.message_id,
    });

    try {
      const msg = ctx.message;
      const messageKind =
        msg === undefined
          ? "none"
          : "text" in msg
            ? "text"
            : Object.keys(msg)[0];

      const payload = TelegramMessageEvent.fromCtx(ctx);

      if (payload === null) {
        logger.trace(
          { chatId: ctx.chat.id, messageKind },
          "message skipped (only plain text is ingested)",
        );

        return;
      }

      logger.debug(payload, "telegram message event received");

      const command = Command.new(INGEST_GROUP_MESSAGE, payload, {
        traceId: UUIDv7.new(),
        userId: String(payload.userId),
      });

      await deps.commandBus.dispatch(command);
    } catch (error) {
      logger.unexpectedError(error);
    }
  });
}
