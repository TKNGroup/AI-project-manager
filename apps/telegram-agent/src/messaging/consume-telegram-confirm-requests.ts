import { jetstream } from "@nats-io/jetstream";

import { buildConfirmInlineKeyboard } from "../bot/keyboards/confirm-keyboard";
import { parseTelegramConfirmRequest } from "../telegram/telegram-confirm-request";
import {
  NATS_CONSUMERS,
  NATS_STREAMS,
  NATS_SUBJECTS,
} from "./nats-subjects";

import type { Logger } from "@common/logger";
import type { NatsConnection } from "@nats-io/transport-node";
import type { Telegraf } from "telegraf";

export type ConsumeTelegramConfirmRequestsDeps = {
  natsConnection: NatsConnection;
  bot: Telegraf;
  propsLogger: Logger;
};

export function startTelegramConfirmRequestsConsumer(
  deps: ConsumeTelegramConfirmRequestsDeps,
): void {
  const logger = deps.propsLogger.stack("consumeTelegramConfirmRequests");

  void (async (): Promise<void> => {
    const js = jetstream(deps.natsConnection);
    const consumer = await js.consumers.get(
      NATS_STREAMS.notifications,
      NATS_CONSUMERS.telegramAgentConfirm,
    );

    const messages = await consumer.consume();

    logger.info(
      { subject: NATS_SUBJECTS.confirmRequest },
      "confirm requests consumer started",
    );

    for await (const msg of messages) {
      const msgLogger = logger.addTraceId();

      try {
        const request = parseTelegramConfirmRequest(msg.data);
        const chatId = Number(request.chatId);

        if (Number.isNaN(chatId)) {
          msgLogger.error({ chatId: request.chatId }, "invalid chatId in confirm request");
          msg.term();

          continue;
        }

        await deps.bot.telegram.sendMessage(chatId, request.message, {
          reply_markup: {
            inline_keyboard: buildConfirmInlineKeyboard(request),
          },
        });

        msg.ack();

        msgLogger.info(request, "confirm request sent to telegram");
      } catch (error) {
        msgLogger.unexpectedError(error);
        msg.nak();
      }
    }
  })().catch((error: unknown) => {
    logger.unexpectedError(error);
    logger.fatal("confirm requests consumer stopped");
  });
}
