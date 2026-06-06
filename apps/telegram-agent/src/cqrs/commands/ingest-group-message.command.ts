import { type TelegramMessageEvent } from "../../telegram/telegram-message-event";

import type { Command } from "@common/cqrs";

export const INGEST_GROUP_MESSAGE = "ingest.group.message" as const;

export type IngestGroupMessageCommand = Command<
  typeof INGEST_GROUP_MESSAGE,
  TelegramMessageEvent,
  void
>;
