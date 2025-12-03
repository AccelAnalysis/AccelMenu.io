import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().min(1),
});

export const createScreenSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateScreenSchema = createScreenSchema.partial();
