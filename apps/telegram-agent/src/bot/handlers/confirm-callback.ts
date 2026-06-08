import { parseConfirmCallbackData } from "../keyboards/confirm-keyboard";

import type { PublishTelegramConfirmResponse } from "../../messaging/publish-telegram-confirm-response";
import type { Logger } from "@common/logger";
import type { Telegraf } from "telegraf";

export type ConfirmCallbackHandlerDeps = {
  propsLogger: Logger;
  publishConfirmResponse: PublishTelegramConfirmResponse;
};

export function registerConfirmCallbackHandler(
  bot: Telegraf,
  deps: ConfirmCallbackHandlerDeps,
): void {
  const handlerLogger = deps.propsLogger.stack("telegram::event#callback_query");

  bot.on("callback_query", async (ctx) => {
    const logger = handlerLogger.addTraceId();

    try {
      if (!("data" in ctx.callbackQuery) || ctx.callbackQuery.data === undefined) {
        return;
      }

      const parsed = parseConfirmCallbackData(ctx.callbackQuery.data);

      if (parsed === null) {
        return;
      }

      const chatId = String(ctx.callbackQuery.message?.chat.id ?? "");

      if (chatId.length === 0) {
        logger.warn("confirm callback without chat id");

        return;
      }

      await deps.publishConfirmResponse({
        id: parsed.id,
        chatId: chatId,
        accepted: parsed.accepted,
        action: parsed.action,
      });

      const answerText = parsed.accepted ? "Принято" : "Отклонено";

      await ctx.answerCbQuery(answerText);

      if (ctx.callbackQuery.message !== undefined) {
        await ctx.editMessageReplyMarkup(undefined);
      }

      logger.info(
        {
          id: parsed.id,
          chatId: chatId,
          accepted: parsed.accepted,
          action: parsed.action,
        },
        "confirm response published to nats",
      );
    } catch (error) {
      logger.unexpectedError(error);

      await ctx.answerCbQuery("Ошибка обработки").catch(() => undefined);
    }
  });
}
