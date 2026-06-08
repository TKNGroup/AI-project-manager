import z from "zod";

export const TELEGRAM_CONFIRM_ACTIONS = ["create_task", "update_task"] as const;

export type TelegramConfirmAction = (typeof TELEGRAM_CONFIRM_ACTIONS)[number];

export type TelegramConfirmRequest = {
  id: string;
  chatId: string;
  message: string;
  action: TelegramConfirmAction;
};

const telegramConfirmRequestSchema = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  message: z.string().min(1),
  action: z.enum(TELEGRAM_CONFIRM_ACTIONS),
});

export function parseTelegramConfirmRequest(
  data: Uint8Array,
): TelegramConfirmRequest {
  const raw: unknown = JSON.parse(new TextDecoder().decode(data));

  return telegramConfirmRequestSchema.parse(raw);
}
