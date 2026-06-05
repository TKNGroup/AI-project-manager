import z from "zod";

export const envConfigSchema = z.object({
  logger: z.object({
    level: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  }),

  nats: z.object({
    url: z.string().url().optional(),
  }),
});
