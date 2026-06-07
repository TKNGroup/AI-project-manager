import { jetstream } from "@nats-io/jetstream";

import { NATS_SUBJECTS } from "./nats-subjects";

import type { TelegramMessageEvent } from "../telegram/telegram-message-event";
import type { NatsConnection } from "@nats-io/transport-node";

export type PublishTelegramMessageEvent = (
  event: TelegramMessageEvent,
) => Promise<void>;

export function createTelegramMessageEventPublisher(
  nc: NatsConnection,
): PublishTelegramMessageEvent {
  const js = jetstream(nc);

  return async (event: TelegramMessageEvent): Promise<void> => {
    await js.publish(NATS_SUBJECTS.rawMessage, JSON.stringify(event));
  };
}
