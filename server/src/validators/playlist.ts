import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().min(1),
});

export const createPlaylistEntrySchema = z.object({
  screenId: z.string().min(1),
  slideId: z.string().min(1),
  position: z.number().int().nonnegative(),
  active: z.boolean().optional(),
});

export const updatePlaylistEntrySchema = createPlaylistEntrySchema.partial();

export const reorderPlaylistEntriesSchema = z.array(
  z.object({
    id: z.string().min(1),
    position: z.number().int().nonnegative(),
  })
);
