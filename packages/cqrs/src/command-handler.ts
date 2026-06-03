import { type Command, type InferCommandResult } from "./command";

export type CommandHandler<CommandT extends Command<string, unknown, unknown>> =
  (command: CommandT) => Promise<InferCommandResult<CommandT>>;
