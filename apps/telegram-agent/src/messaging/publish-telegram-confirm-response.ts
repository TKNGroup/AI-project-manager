import { jetstream } from "@nats-io/jetstream";

import { NATS_SUBJECTS } from "./nats-subjects";

import type { TelegramConfirmResponse } from "../telegram/telegram-confirm-response";
import type { NatsConnection } from "@nats-io/transport-node";

export type PublishTelegramConfirmResponse = (
  response: TelegramConfirmResponse,
) => Promise<void>;

export function createTelegramConfirmResponsePublisher(
  nc: NatsConnection,
): PublishTelegramConfirmResponse {
  const js = jetstream(nc);

  return async (response: TelegramConfirmResponse): Promise<void> => {
    await js.publish(NATS_SUBJECTS.confirmResponse, JSON.stringify(response));
  };
}
