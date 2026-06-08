import z from "zod";

export const envConfigSchema = z.object({
  botToken: z.string().min(1),
  nats: z.object({
    host: z.string().min(1),
    port: z.coerce.number().int().positive(),
  }),
  logger: z.object({
    level: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  }),
});
