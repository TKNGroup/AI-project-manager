export type TelegramMessageEvent = {
  userId: number;
  chatId: number;
  message: string;
  messageAt: string;
  messageId?: number;
};
