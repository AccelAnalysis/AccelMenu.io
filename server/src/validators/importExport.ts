import { z } from "zod";

export const importBundleSchema = z.object({
  slides: z.array(z.record(z.any())).default([]),
  screens: z.array(z.record(z.any())).default([]),
  playlists: z.array(z.record(z.any())).default([]),
  playlistEntries: z.array(z.record(z.any())).default([]),
});

export type ImportBundleInput = z.infer<typeof importBundleSchema>;
