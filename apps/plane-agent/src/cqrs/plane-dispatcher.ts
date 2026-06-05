import { Logger } from "@common/logger";

import type { NatsEventBus } from "../events/event-bus";
import type { PlaneClient } from "../plane/plane-client";
import type { PlaneCommand, PlaneQuery } from "./plane-commands";
import type { Command, Query } from "@common/cqrs";

type UnknownCommand = Command<string, unknown, unknown>;
type UnknownQuery = Query<string, unknown, unknown>;

export class PlaneDispatcher {
  public constructor(
    private readonly planeClient: PlaneClient,
    private readonly eventBus: NatsEventBus,
    private readonly logger: Logger,
  ) {}

  public async dispatchCommand(command: UnknownCommand): Promise<unknown> {
    if (!command.name.startsWith("plane.")) {
      await this.eventBus.publish("aipm.commands", command);

      return { forwarded: true, subject: "aipm.commands" };
    }

    const result = await this.handlePlaneCommand(command as PlaneCommand);

    await this.eventBus.publish("aipm.events.plane", {
      name: `${command.name}.completed`,
      payload: result,
      meta: command.meta,
    });

    return result;
  }

  public async dispatchQuery(query: UnknownQuery): Promise<unknown> {
    return await this.handlePlaneQuery(query as PlaneQuery);
  }

  private async handlePlaneCommand(command: PlaneCommand): Promise<unknown> {
    this.logger.debug({ command: command.name }, "handle plane command");

    switch (command.name) {
      case "plane.work-item.create":
        return await this.planeClient.createWorkItem(command.payload);

      case "plane.work-item.update":
        return await this.planeClient.updateWorkItem(
          command.payload.workItemId,
          command.payload.patch,
        );

      case "plane.work-item.move":
        return await this.planeClient.moveWorkItem(
          command.payload.workItemId,
          command.payload.stateId,
        );

      case "plane.work-item.close":
        return await this.planeClient.closeWorkItem(
          command.payload.workItemId,
          command.payload.completedStateId,
        );

      default: {
        throw new Error("Unsupported Plane command");
      }
    }
  }

  private async handlePlaneQuery(query: PlaneQuery): Promise<unknown> {
    this.logger.debug({ query: query.name }, "handle plane query");

    switch (query.name) {
      case "plane.project.list":
        return await this.planeClient.listProjects();

      case "plane.state.list":
        return await this.planeClient.listStates();

      case "plane.work-item.list":
        return await this.planeClient.listWorkItems();

      default: {
        throw new Error("Unsupported Plane query");
      }
    }
  }
}
