import { Telegraf } from "telegraf";

import { registerMessageHandler } from "./handlers/message";
import { registerStartHandler } from "./handlers/start";

import type { CommandBus } from "../cqrs/bus/command-bus";
import type { Logger } from "@common/logger";

export type CreateBotDeps = {
  token: string;
  logger: Logger;
  commandBus: CommandBus;
};

export function createBot(deps: CreateBotDeps): Telegraf {
  const bot = new Telegraf(deps.token);

  registerStartHandler(bot);
  registerMessageHandler(bot, {
    logger: deps.logger,
    commandBus: deps.commandBus,
  });

  return bot;
}
