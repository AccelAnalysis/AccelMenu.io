import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().min(1),
});

const elementSchema = z
  .object({
    id: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    zIndex: z.number().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontSize: z.number().optional(),
    opacity: z.number().optional(),
    content: z.string().optional(),
    location: z.string().optional(),
    apiKey: z.string().optional(),
    units: z.enum(["imperial", "metric"]).optional(),
    platform: z.string().optional(),
    handle: z.string().optional(),
    feedUrl: z.string().optional(),
    url: z.string().optional(),
    label: z.string().optional(),
  })
  .passthrough();

const slideContentSchema = z
  .object({
    name: z.string().optional(),
    background: z.string().optional(),
    elements: z.array(elementSchema).optional(),
  })
  .passthrough();

export const createSlideSchema = z.object({
  title: z.string().min(1),
  content: slideContentSchema,
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
