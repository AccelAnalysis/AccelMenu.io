import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().min(1),
});

export const createSlideSchema = z.object({
  title: z.string().min(1),
  content: z.unknown(),
  mediaUrl: z.string().url().optional(),
  duration: z.number().int().positive(),
  order: z.number().int(),
});

export const updateSlideSchema = createSlideSchema.partial();

export const reorderSlidesSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int(),
  })
);
