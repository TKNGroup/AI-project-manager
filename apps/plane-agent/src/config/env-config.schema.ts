import z from "zod";

export const envConfigSchema = z.object({
  host: z.string().default("0.0.0.0"),
  port: z.coerce.number().int().positive().default(3003),

  logger: z.object({
    level: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  }),

  nats: z.object({
    url: z.string().url().optional(),
  }),

  plane: z.object({
    baseUrl: z.string().url().default("http://localhost:8090"),
    apiKey: z.string().min(1),
    workspaceSlug: z.string().min(1),
    projectId: z.string().min(1),
    webhookUrl: z.string().url().optional(),
  }),
});
