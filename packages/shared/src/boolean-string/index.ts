import z from "zod";

export const booleanStringSchema = z
  .string()
  .refine((v) => v === "true" || v === "false")
  .transform((v) => v === "true");
