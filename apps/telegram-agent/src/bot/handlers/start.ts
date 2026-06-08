import { type Logger } from "@common/logger";

import type { Telegraf } from "telegraf";

export function registerStartHandler(bot: Telegraf, propsLogger: Logger): void {
  const handlerLogger = propsLogger.stack("telegram::event#start");

  bot.start(async (ctx) => {
    const logger = handlerLogger.addTraceId();

    logger.info({ chatId: ctx.chat.id }, "telegram bot started");

    await ctx.reply(
      "Бот запущен. Пишите сообщения в группе — они уйдут в обработку.",
    );
  });
}
