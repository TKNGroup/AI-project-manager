import z from "zod";

export const envConfigSchema = z.object({
  logger: z.object({
    level: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  }),
});
