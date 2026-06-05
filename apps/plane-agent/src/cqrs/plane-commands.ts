import { Command, Query } from "@common/cqrs";

import type {
  CreateWorkItemInput,
  PlaneProject,
  PlaneState,
  PlaneWorkItem,
  UpdateWorkItemInput,
} from "../plane/plane-client";
import type { CqrsMeta } from "@common/cqrs";

export type CreatePlaneWorkItemCommand = Command<
  "plane.work-item.create",
  CreateWorkItemInput,
  PlaneWorkItem
>;

export type UpdatePlaneWorkItemCommand = Command<
  "plane.work-item.update",
  { workItemId: string; patch: UpdateWorkItemInput },
  PlaneWorkItem
>;

export type MovePlaneWorkItemCommand = Command<
  "plane.work-item.move",
  { workItemId: string; stateId: string },
  PlaneWorkItem
>;

export type ClosePlaneWorkItemCommand = Command<
  "plane.work-item.close",
  { workItemId: string; completedStateId: string },
  PlaneWorkItem
>;

export type PlaneCommand =
  | CreatePlaneWorkItemCommand
  | UpdatePlaneWorkItemCommand
  | MovePlaneWorkItemCommand
  | ClosePlaneWorkItemCommand;

export type ListPlaneProjectsQuery = Query<
  "plane.project.list",
  Record<string, never>,
  PlaneProject[]
>;

export type ListPlaneStatesQuery = Query<
  "plane.state.list",
  Record<string, never>,
  PlaneState[]
>;

export type ListPlaneWorkItemsQuery = Query<
  "plane.work-item.list",
  Record<string, never>,
  PlaneWorkItem[]
>;

export type PlaneQuery =
  | ListPlaneProjectsQuery
  | ListPlaneStatesQuery
  | ListPlaneWorkItemsQuery;

export const PlaneCommands = {
  createWorkItem: (
    payload: CreateWorkItemInput,
    meta: CqrsMeta,
  ): CreatePlaneWorkItemCommand => {
    return Command.new("plane.work-item.create", payload, meta);
  },

  updateWorkItem: (
    payload: { workItemId: string; patch: UpdateWorkItemInput },
    meta: CqrsMeta,
  ): UpdatePlaneWorkItemCommand => {
    return Command.new("plane.work-item.update", payload, meta);
  },

  moveWorkItem: (
    payload: { workItemId: string; stateId: string },
    meta: CqrsMeta,
  ): MovePlaneWorkItemCommand => {
    return Command.new("plane.work-item.move", payload, meta);
  },

  closeWorkItem: (
    payload: { workItemId: string; completedStateId: string },
    meta: CqrsMeta,
  ): ClosePlaneWorkItemCommand => {
    return Command.new("plane.work-item.close", payload, meta);
  },
};

export const PlaneQueries = {
  listProjects: (meta: CqrsMeta): ListPlaneProjectsQuery => {
    return Query.new("plane.project.list", {}, meta);
  },

  listStates: (meta: CqrsMeta): ListPlaneStatesQuery => {
    return Query.new("plane.state.list", {}, meta);
  },

  listWorkItems: (meta: CqrsMeta): ListPlaneWorkItemsQuery => {
    return Query.new("plane.work-item.list", {}, meta);
  },
};
