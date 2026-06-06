import { Command } from "@common/cqrs";
import { UUIDv7 } from "@common/shared";

import { INGEST_GROUP_MESSAGE } from "../../cqrs/commands/ingest-group-message.command";
import { toIngestPayload } from "../../telegram/to-ingest-payload";

import type { CommandBus } from "../../cqrs/bus/command-bus";
import type { Logger } from "@common/logger";
import type { Telegraf } from "telegraf";

export type MessageHandlerDeps = {
  logger: Logger;
  commandBus: CommandBus;
};

export function registerMessageHandler(
  bot: Telegraf,
  deps: MessageHandlerDeps,
): void {
  bot.on("message", async (ctx) => {
    const msg = ctx.message;
    const messageKind =
      msg === undefined ? "none" : "text" in msg ? "text" : Object.keys(msg)[0];

    const payload = toIngestPayload(ctx);

    if (payload === null) {
      deps.logger.info(
        { chatId: ctx.chat.id, messageKind },
        "message skipped (only plain text is ingested)",
      );

      return;
    }

    deps.logger.info(payload, "telegram message event received");

    const command = Command.new(INGEST_GROUP_MESSAGE, payload, {
      traceId: UUIDv7.new(),
      userId: String(payload.userId),
    });

    try {
      await deps.commandBus.dispatch(command);
    } catch (error) {
      deps.logger.error(error, "failed to dispatch command");
    }
  });
}
