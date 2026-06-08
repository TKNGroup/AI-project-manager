export type PlaneConfig = {
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
};

export type PlaneWorkItem = {
  id: string;
  name: string;
  description_html?: string | null;
  state?: string | { id: string; name: string };
  assignees?: string[] | Array<{ id: string; display_name?: string }>;
  target_date?: string | null;
  priority?: string | null;
};

export type PlaneState = {
  id: string;
  name: string;
  color?: string;
  group?: string;
};

export type PlaneProject = {
  id: string;
  name: string;
  identifier?: string;
};

export type CreateWorkItemInput = {
  name: string;
  descriptionHtml?: string;
  assigneeIds?: string[];
  stateId?: string;
  priority?: "none" | "low" | "medium" | "high" | "urgent";
  targetDate?: string;
};

export type UpdateWorkItemInput = Partial<CreateWorkItemInput>;

export type PlaneWebhook = {
  id: string;
  url: string;
  is_active: boolean;
  project: boolean;
  issue: boolean;
  module: boolean;
  cycle: boolean;
  issue_comment: boolean;
  created_at: string;
  updated_at: string;
};

export class PlaneClient {
  public constructor(private readonly config: PlaneConfig) {}

  public async listProjects(): Promise<PlaneProject[]> {
    return await this.request<PlaneProject[]>(
      "GET",
      `/api/v1/workspaces/${this.config.workspaceSlug}/projects/`,
    );
  }

  public async listStates(): Promise<PlaneState[]> {
    return await this.request<PlaneState[]>(
      "GET",
      this.projectPath("/states/"),
    );
  }

  public async listWorkItems(): Promise<PlaneWorkItem[]> {
    return await this.request<PlaneWorkItem[]>(
      "GET",
      this.projectPath("/work-items/?expand=assignees,state,project"),
    );
  }

  public async registerWebhook(url: string): Promise<PlaneWebhook> {
    const payload = {
      url,
      project: true,
      issue: true,
      module: true,
      cycle: true,
      issue_comment: true,
    };

    try {
      return await this.request<PlaneWebhook>(
        "POST",
        `/api/workspaces/${this.config.workspaceSlug}/webhooks/`,
        payload,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists") || message.includes("409")) {
        const existing = await this.request<PlaneWebhook[]>(
          "GET",
          `/api/workspaces/${this.config.workspaceSlug}/webhooks/`,
        );
        const webhook = existing.find((item) => item.url === url);
        if (webhook) {
          return webhook;
        }
      }
      throw error;
    }
  }

  public async createWorkItem(
    input: CreateWorkItemInput,
  ): Promise<PlaneWorkItem> {
    return await this.request<PlaneWorkItem>(
      "POST",
      this.projectPath("/work-items/"),
      this.toPlanePayload(input),
    );
  }

  public async updateWorkItem(
    workItemId: string,
    input: UpdateWorkItemInput,
  ): Promise<PlaneWorkItem> {
    return await this.request<PlaneWorkItem>(
      "PATCH",
      this.projectPath(`/work-items/${workItemId}/`),
      this.toPlanePayload(input),
    );
  }

  public async moveWorkItem(
    workItemId: string,
    stateId: string,
  ): Promise<PlaneWorkItem> {
    return await this.updateWorkItem(workItemId, { stateId: stateId });
  }

  public async closeWorkItem(
    workItemId: string,
    completedStateId: string,
  ): Promise<PlaneWorkItem> {
    return await this.moveWorkItem(workItemId, completedStateId);
  }

  private projectPath(path: string): string {
    return `/api/v1/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}${path}`;
  }

  private toPlanePayload(
    input: CreateWorkItemInput | UpdateWorkItemInput,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (input.name !== undefined) {
      payload["name"] = input.name;
    }

    if (input.descriptionHtml !== undefined) {
      payload["description_html"] = input.descriptionHtml;
    }

    if (input.assigneeIds !== undefined) {
      payload["assignee_ids"] = input.assigneeIds;
    }

    if (input.stateId !== undefined) {
      payload["state_id"] = input.stateId;
    }

    if (input.priority !== undefined) {
      payload["priority"] = input.priority;
    }

    if (input.targetDate !== undefined) {
      payload["target_date"] = input.targetDate;
    }

    return payload;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.config.apiKey,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Plane API ${method} ${url.pathname} failed: ${response.status} ${text}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
