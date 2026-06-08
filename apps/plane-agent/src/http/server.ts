import { HttpStatus } from "@common/http";
import z from "zod";

import { PlaneCommands, PlaneQueries } from "../cqrs/plane-commands";

import type { PlaneDispatcher } from "../cqrs/plane-dispatcher";
import type { NatsEventBus } from "../events/event-bus";
import type { CqrsMeta } from "@common/cqrs";

const prioritySchema = z.enum(["none", "low", "medium", "high", "urgent"]);

const workItemInputSchema = z.object({
  name: z.string().min(1),
  descriptionHtml: z.string().optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
  stateId: z.string().min(1).optional(),
  priority: prioritySchema.optional(),
  targetDate: z.string().min(1).optional(),
});

const workItemPatchSchema = workItemInputSchema.partial();

const genericCommandSchema = z.object({
  name: z.string().min(1),
  payload: z.unknown(),
  meta: z
    .object({
      traceId: z.string().optional(),
      ip: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
});

type ServerConfig = {
  host: string;
  port: number;
};

export function startHttpServer(
  config: ServerConfig,
  dispatcher: PlaneDispatcher,
  eventBus?: NatsEventBus,
): Bun.Server<unknown> {
  return Bun.serve({
    hostname: config.host,
    port: config.port,
    routes: {
      "/health": async () => {
        return json({ ok: true });
      },

      "/commands": async (request) => {
        if (request.method !== "POST") {
          return methodNotAllowed();
        }

        const body = genericCommandSchema.parse(await request.json());
        const result = await dispatcher.dispatchCommand({
          name: body.name,
          payload: body.payload,
          meta: makeMeta(request, body.meta),
        });

        return json({ ok: true, value: result });
      },

      "/queries": async (request) => {
        if (request.method !== "POST") {
          return methodNotAllowed();
        }

        const body = genericCommandSchema.parse(await request.json());
        const result = await dispatcher.dispatchQuery({
          name: body.name,
          payload: body.payload,
          meta: makeMeta(request, body.meta),
        });

        return json({ ok: true, value: result });
      },

      "/plane/projects": async (request) => {
        if (request.method !== "GET") {
          return methodNotAllowed();
        }

        const result = await dispatcher.dispatchQuery(
          PlaneQueries.listProjects(makeMeta(request)),
        );

        return json({ ok: true, value: result });
      },

      "/plane/states": async (request) => {
        if (request.method !== "GET") {
          return methodNotAllowed();
        }

        const result = await dispatcher.dispatchQuery(
          PlaneQueries.listStates(makeMeta(request)),
        );

        return json({ ok: true, value: result });
      },

      "/plane/work-items": async (request) => {
        if (request.method === "GET") {
          const result = await dispatcher.dispatchQuery(
            PlaneQueries.listWorkItems(makeMeta(request)),
          );

          return json({ ok: true, value: result });
        }

        if (request.method === "POST") {
          const payload = workItemInputSchema.parse(await request.json());
          const result = await dispatcher.dispatchCommand(
            PlaneCommands.createWorkItem(payload, makeMeta(request)),
          );

          return json({ ok: true, value: result }, HttpStatus.CREATED);
        }

        return methodNotAllowed();
      },

      "/plane/work-items/:workItemId": async (request) => {
        if (request.method !== "PATCH") {
          return methodNotAllowed();
        }

        const workItemId = request.params.workItemId;
        const patch = workItemPatchSchema.parse(await request.json());
        const result = await dispatcher.dispatchCommand(
          PlaneCommands.updateWorkItem(
            { workItemId: workItemId, patch: patch },
            makeMeta(request),
          ),
        );

        return json({ ok: true, value: result });
      },

      "/plane/work-items/:workItemId/move": async (request) => {
        if (request.method !== "POST") {
          return methodNotAllowed();
        }

        const body = z
          .object({ stateId: z.string().min(1) })
          .parse(await request.json());
        const result = await dispatcher.dispatchCommand(
          PlaneCommands.moveWorkItem(
            { workItemId: request.params.workItemId, stateId: body.stateId },
            makeMeta(request),
          ),
        );

        return json({ ok: true, value: result });
      },

      "/plane/work-items/:workItemId/close": async (request) => {
        if (request.method !== "POST") {
          return methodNotAllowed();
        }

        const body = z
          .object({ completedStateId: z.string().min(1) })
          .parse(await request.json());
        const result = await dispatcher.dispatchCommand(
          PlaneCommands.closeWorkItem(
            {
              workItemId: request.params.workItemId,
              completedStateId: body.completedStateId,
            },
            makeMeta(request),
          ),
        );

        return json({ ok: true, value: result });
      },

      "/plane/webhook": async (request) => {
        if (request.method !== "POST") return methodNotAllowed();

        let body: unknown;

        try {
          body = await request.json();
        } catch (e) {
          // fallback to text
          const txt = await request.text();
          try {
            body = JSON.parse(txt);
          } catch (_) {
            body = { raw: txt };
          }
        }

        // simple filter: drop comment-like fields
        const filter = (obj: any) => {
          if (obj === null || typeof obj !== "object") return obj;
          const out: any = Array.isArray(obj) ? [] : {};

          for (const [k, v] of Object.entries(obj)) {
            const lower = k.toLowerCase();
            if (lower.includes("comment") || lower.includes("comments") || lower === "notes") {
              continue;
            }

            if (typeof v === "object" && v !== null) out[k] = filter(v as any);
            else out[k] = v;
          }

          return out;
        };

        const filtered = filter(body as any);

        const message = {
          source: "plane",
          received_at: new Date().toISOString(),
          event: (body as any)?.type ?? (body as any)?.event ?? null,
          payload: filtered,
          raw: body,
          headers: Object.fromEntries(request.headers),
        };

        if (eventBus) {
          try {
            // log published message for local verification
            console.log("publishing raw-data.messages", JSON.stringify(message));
            await eventBus.publish("raw-data.messages", message);
          } catch (e) {
            console.error("failed publish", e);
            return json({ ok: false, error: String(e) }, 500);
          }
        }

        return json({ ok: true });
      },
    },
    error: (error) => {
      return json(
        { ok: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    },
  });
}

function makeMeta(request: Request, meta?: CqrsMeta): CqrsMeta {
  return {
    traceId: meta?.traceId ?? crypto.randomUUID(),
    ip: meta?.ip ?? request.headers.get("x-forwarded-for") ?? undefined,
    userId: meta?.userId,
  };
}

function methodNotAllowed(): Response {
  return json(
    { ok: false, error: "Method not allowed" },
    HttpStatus.METHOD_NOT_ALLOWED,
  );
}

function json(body: unknown, status = HttpStatus.OK): Response {
  return Response.json(body, { status: status });
}
