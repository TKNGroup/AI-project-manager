import type { TelegramConfirmAction } from "./telegram-confirm-request";

export type TelegramConfirmResponse = {
  id: string;
  chatId: string;
  accepted: boolean;
  action: TelegramConfirmAction;
};
