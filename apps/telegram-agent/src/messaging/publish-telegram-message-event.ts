import { jetstream } from "@nats-io/jetstream";

import type { TelegramMessageEvent } from "../telegram/telegram-message-event";
import type { NatsConnection } from "@nats-io/transport-node";

const RAW_MESSAGE_SUBJECT = "raw-data.messages";

export type PublishTelegramMessageEvent = (
  event: TelegramMessageEvent,
) => Promise<void>;

export function createTelegramMessageEventPublisher(
  nc: NatsConnection,
): PublishTelegramMessageEvent {
  const js = jetstream(nc);

  return async (event: TelegramMessageEvent): Promise<void> => {
    await js.publish(RAW_MESSAGE_SUBJECT, JSON.stringify(event));
  };
}
