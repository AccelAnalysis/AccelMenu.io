import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().min(1),
});

export const createScreenSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  rotation: z.number().int().positive().optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateScreenSchema = createScreenSchema.partial();
