import type { InlineKeyboardButton } from "telegraf/types";

import type { TelegramConfirmRequest } from "../../telegram/telegram-confirm-request";

const CALLBACK_PREFIX = "cfm";

export function buildConfirmCallbackData(
  accepted: boolean,
  request: Pick<TelegramConfirmRequest, "id" | "action">,
): string {
  const answer = accepted ? "y" : "n";

  return `${CALLBACK_PREFIX}:${answer}:${request.action}:${request.id}`;
}

export function parseConfirmCallbackData(
  data: string,
): { accepted: boolean; id: string; action: TelegramConfirmRequest["action"] } | null {
  const parts = data.split(":");

  if (parts.length !== 4 || parts[0] !== CALLBACK_PREFIX) {
    return null;
  }

  const answer = parts[1];
  const action = parts[2];
  const id = parts[3];

  if (answer !== "y" && answer !== "n") {
    return null;
  }

  if (action !== "create_task" && action !== "update_task") {
    return null;
  }

  if (id === undefined || id.length === 0) {
    return null;
  }

  return {
    accepted: answer === "y",
    id: id,
    action: action,
  };
}

export function buildConfirmInlineKeyboard(
  request: Pick<TelegramConfirmRequest, "id" | "action">,
): InlineKeyboardButton[][] {
  return [
    [
      { text: "Да", callback_data: buildConfirmCallbackData(true, request) },
      { text: "Нет", callback_data: buildConfirmCallbackData(false, request) },
    ],
  ];
}
