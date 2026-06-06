import type { Command, CommandHandler } from "@common/cqrs";

type AnyCommand = Command<string, unknown, unknown>;

export class CommandBus {
  private readonly handlers = new Map<string, CommandHandler<AnyCommand>>();

  public register<CommandT extends AnyCommand>(
    name: CommandT["name"],
    handler: CommandHandler<CommandT>,
  ): void {
    this.handlers.set(name, handler as CommandHandler<AnyCommand>);
  }

  public async dispatch(command: AnyCommand): Promise<void> {
    const handler = this.handlers.get(command.name);

    if (handler === undefined) {
      throw new Error(`command handler not found: ${command.name}`);
    }

    await handler(command);
  }
}
