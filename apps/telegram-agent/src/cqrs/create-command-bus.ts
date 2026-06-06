import { CommandBus } from "./bus/command-bus";
import { ingestGroupMessageCommandHandlerFactory } from "./commands/ingest-group-message.command";

import type { PublishTelegramMessageEvent } from "../messaging/publish-telegram-message-event";
import type { Logger } from "@common/logger";

export type CreateCommandBusDeps = {
  propsLogger: Logger;
  publishTelegramMessageEvent: PublishTelegramMessageEvent;
};

export function commandBusFactory(deps: CreateCommandBusDeps): CommandBus {
  const bus = new CommandBus();

  const ingestGroupMessageCommandHandler =
    ingestGroupMessageCommandHandlerFactory({
      propsLogger: deps.propsLogger,
      publishTelegramMessageEvent: deps.publishTelegramMessageEvent,
    });

  bus.register(ingestGroupMessageCommandHandler, "ingest.group.message");

  return bus;
}
