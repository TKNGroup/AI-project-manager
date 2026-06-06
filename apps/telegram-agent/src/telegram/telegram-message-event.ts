import { type Context } from "telegraf";

export type TelegramMessageEvent = {
  userId: number;
  chatId: number;
  message: string;
  messageAt: string;
  messageId?: number;
};

export const TelegramMessageEvent = {
  fromCtx(ctx: Context): TelegramMessageEvent | null {
    const msg = ctx.message;

    if (!msg || !ctx.from || !ctx.chat || !("text" in msg) || !msg.text) {
      return null;
    }

    return {
      userId: ctx.from.id,
      chatId: ctx.chat.id,
      message: msg.text,
      messageAt: new Date(msg.date * 1000).toISOString(),
      messageId: msg.message_id,
    };
  },
};
