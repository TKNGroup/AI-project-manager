import type { Telegraf } from "telegraf";

export function registerStartHandler(bot: Telegraf): void {
  bot.start(async (ctx) => {
    await ctx.reply(
      "Бот запущен. Пишите сообщения в группе — они уйдут в обработку.",
    );
  });
}
