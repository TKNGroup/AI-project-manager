import type { TelegramMessageEvent } from "./telegram-message-event";
import type { Context } from "telegraf";

export function toIngestPayload(ctx: Context): TelegramMessageEvent | null {
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
}
