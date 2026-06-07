export const NATS_SUBJECTS = {
  rawMessage: "raw-data.messages",
  confirmRequest: "notifications.telegram.confirm",
  confirmResponse: "telegram.confirm.response",
} as const;

export const NATS_STREAMS = {
  rawData: "RAW_DATA",
  notifications: "NOTIFICATIONS",
  telegramResponses: "TELEGRAM_RESPONSES",
} as const;

export const NATS_CONSUMERS = {
  telegramAgentConfirm: "telegram-agent-confirm",
} as const;
