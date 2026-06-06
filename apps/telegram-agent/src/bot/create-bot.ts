import { Telegraf } from "telegraf";

import { registerMessageHandler } from "./handlers/message";
import { registerStartHandler } from "./handlers/start";

import type { CommandBus } from "../cqrs/bus/command-bus";
import type { Logger } from "@common/logger";

export type CreateBotDeps = {
  token: string;
  propsLogger: Logger;
  commandBus: CommandBus;
};

export async function bootstrapBot(deps: CreateBotDeps): Promise<Telegraf> {
  const logger = deps.propsLogger.stack("bootstrapBot");

  try {
    const bot = new Telegraf(deps.token);

    process.once("SIGINT", () => {
      void bot.stop("SIGINT");
    });

    process.once("SIGTERM", () => {
      void bot.stop("SIGTERM");
    });

    registerStartHandler(bot, deps.propsLogger);

    registerMessageHandler(bot, {
      propsLogger: deps.propsLogger,
      commandBus: deps.commandBus,
    });

    await bot.launch();

    logger.info("launched");

    return bot;
  } catch (error) {
    logger.unexpectedError(error);

    logger.fatal("bot cant launch");

    process.exit(1);
  }
}
