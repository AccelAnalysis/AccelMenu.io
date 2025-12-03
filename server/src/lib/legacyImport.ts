import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const legacySlideSchema = z.object({
  id: z.string().min(1).optional(),
  uuid: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  content: z.unknown().optional(),
  body: z.unknown().optional(),
  elements: z.unknown().optional(),
  mediaUrl: z.string().optional(),
  media: z.string().optional(),
  duration: z.number().optional(),
  durationMs: z.number().optional(),
  durationSeconds: z.number().optional(),
  order: z.number().optional(),
  position: z.number().optional(),
});

const legacyScreenSchema = z.object({
  id: z.string().min(1).optional(),
  uuid: z.string().min(1).optional(),
  name: z.string().optional(),
  location: z.string().optional(),
  placement: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  slides: z.array(z.string()).optional(),
});

const legacyPlaylistSchema = z.object({
  screenId: z.string().min(1),
  slides: z.array(z.string()).default([]),
});

const legacyPlaylistEntrySchema = z.object({
  id: z.string().min(1).optional(),
  screenId: z.string().min(1),
  slideId: z.string().min(1),
  position: z.number().int().optional(),
  active: z.boolean().optional(),
});

const legacyBundleSchema = z
  .object({
    slides: z.array(legacySlideSchema).default([]),
    screens: z.array(legacyScreenSchema).default([]),
    playlists: z.array(legacyPlaylistSchema).default([]),
    playlistEntries: z.array(legacyPlaylistEntrySchema).default([]),
  })
  .default({ slides: [], screens: [], playlists: [], playlistEntries: [] });

type LegacyBundle = z.infer<typeof legacyBundleSchema>;

const buildStableId = (namespace: string, payload: unknown) =>
  createHash("sha256").update(namespace).update(JSON.stringify(payload)).digest("hex").slice(0, 24);

const resolveSlideId = (slide: LegacyBundle["slides"][number], index: number) => {
  const candidate = slide.id ?? slide.uuid ?? slide.key ?? slide.title ?? slide.name;
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return buildStableId("slide", { index, title: slide.title ?? slide.name ?? "slide" });
};

const resolveScreenId = (screen: LegacyBundle["screens"][number], index: number) => {
  const candidate = screen.id ?? screen.uuid ?? screen.name;
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return buildStableId("screen", { index, name: screen.name ?? "screen" });
};

const normalizeDuration = (slide: LegacyBundle["slides"][number]) => {
  const durationCandidates = [slide.duration, slide.durationMs, slide.durationSeconds];
  const positiveValue = durationCandidates.find(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0
  );

  if (typeof positiveValue === "number") {
    return Math.round(positiveValue);
  }

  return 15000;
};

const registerSlideAliases = (
  map: Map<string, string>,
  slide: LegacyBundle["slides"][number],
  id: string
) => {
  [slide.id, slide.uuid, slide.key, slide.title, slide.name]
    .filter((value): value is string => Boolean(value && value.trim().length))
    .forEach((alias) => map.set(alias, id));
};

const normalizeSlides = (bundle: LegacyBundle) => {
  const warnings: string[] = [];
  const idMap = new Map<string, string>();

  const slides = bundle.slides.map<Prisma.SlideCreateManyInput>((slide, index) => {
    const id = resolveSlideId(slide, index);
    registerSlideAliases(idMap, slide, id);
    idMap.set(id, id);

    const rawContent =
      (typeof slide.content === "object" && slide.content !== null ? slide.content : null) ??
      (typeof slide.body === "object" && slide.body !== null ? slide.body : null) ??
      (typeof slide === "object" && slide !== null ? slide : {});

    const content = { ...rawContent } as Record<string, unknown>;

    const incomingElements = Array.isArray(slide.elements)
      ? slide.elements
      : Array.isArray((rawContent as Record<string, unknown>).elements)
        ? (rawContent as { elements: unknown[] }).elements
        : [];

    if (incomingElements.length && !content.elements) {
      content.elements = incomingElements;
    }

    if (typeof slide.background === "string" && !content.background) {
      content.background = slide.background;
    }

    const title = slide.title?.trim() || slide.name?.trim() || `Slide ${index + 1}`;
    const mediaUrl = slide.mediaUrl ?? slide.media ?? null;
    const order = Number.isInteger(slide.order)
      ? Number(slide.order)
      : Number.isInteger(slide.position)
        ? Number(slide.position)
        : index;

    return {
      id,
      title,
      content,
      mediaUrl,
      duration: normalizeDuration(slide),
      order,
    };
  });

  if (!slides.length) {
    warnings.push("No slides provided in legacy payload; nothing to import.");
  }

  return { slides, idMap, warnings } as const;
};

const registerScreenAliases = (
  map: Map<string, string>,
  screen: LegacyBundle["screens"][number],
  id: string
) => {
  [screen.id, screen.uuid, screen.name]
    .filter((value): value is string => Boolean(value && value.trim().length))
    .forEach((alias) => map.set(alias, id));
};

const normalizeScreens = (bundle: LegacyBundle) => {
  const warnings: string[] = [];
  const idMap = new Map<string, string>();

  const screens = bundle.screens.map<Prisma.ScreenCreateManyInput>((screen, index) => {
    const id = resolveScreenId(screen, index);
    registerScreenAliases(idMap, screen, id);
    idMap.set(id, id);

    const name = screen.name?.trim() || `Screen ${index + 1}`;
    const location = screen.location?.trim() || screen.placement?.trim() || "";
    const status = screen.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    return { id, name, location, status };
  });

  if (!screens.length) {
    warnings.push("No screens provided in legacy payload; playlists may be incomplete.");
  }

  return { screens, idMap, warnings } as const;
};

const collectPlaylistEntries = (
  bundle: LegacyBundle,
  screenIdMap: Map<string, string>,
  slideIdMap: Map<string, string>
) => {
  const warnings: string[] = [];
  const entries: Prisma.PlaylistEntryCreateManyInput[] = [];
  const dedupeKeys = new Set<string>();

  const appendEntry = (
    screenKey: string,
    slideKey: string,
    position: number,
    active: boolean,
    seed: unknown
  ) => {
    const screenId = screenIdMap.get(screenKey) ?? screenKey;
    const slideId = slideIdMap.get(slideKey) ?? slideKey;

    if (!screenIdMap.has(screenKey) && !screenIdMap.has(screenId)) {
      warnings.push(`Skipping playlist entry: unknown screen ${screenKey}`);
      return;
    }

    if (!slideIdMap.has(slideKey) && !slideIdMap.has(slideId)) {
      warnings.push(`Skipping playlist entry: unknown slide ${slideKey}`);
      return;
    }

    const dedupeKey = `${screenId}:${position}`;
    if (dedupeKeys.has(dedupeKey)) {
      warnings.push(`Skipping duplicate playlist position ${position} for screen ${screenId}`);
      return;
    }

    dedupeKeys.add(dedupeKey);

    entries.push({
      id: buildStableId("playlist-entry", seed),
      screenId,
      slideId,
      position,
      active,
    });
  };

  bundle.playlistEntries.forEach((entry, index) => {
    appendEntry(entry.screenId, entry.slideId, entry.position ?? index, entry.active ?? true, {
      source: "playlistEntries",
      entry,
    });
  });

  bundle.playlists.forEach((playlist) => {
    playlist.slides.forEach((slideId, index) => {
      appendEntry(playlist.screenId, slideId, index, true, { source: "playlists", playlist, index });
    });
  });

  bundle.screens.forEach((screen, screenIndex) => {
    if (!Array.isArray(screen.slides)) return;

    screen.slides.forEach((slideId, index) => {
      appendEntry(screen.id ?? screen.uuid ?? screen.name ?? `screen-${screenIndex}`, slideId, index, true, {
        source: "screen.slides",
        screen,
        index,
      });
    });
  });

  if (!entries.length) {
    warnings.push("No playlist entries detected in legacy payload.");
  }

  return { playlistEntries: entries, warnings } as const;
};

export type ParsedLegacyBundle = {
  slides: Prisma.SlideCreateManyInput[];
  screens: Prisma.ScreenCreateManyInput[];
  playlistEntries: Prisma.PlaylistEntryCreateManyInput[];
  warnings: string[];
};

export const parseLegacyBundle = (input: unknown): ParsedLegacyBundle => {
  const bundle = legacyBundleSchema.parse(input ?? {});

  const slideResult = normalizeSlides(bundle);
  const screenResult = normalizeScreens(bundle);
  const playlistResult = collectPlaylistEntries(bundle, screenResult.idMap, slideResult.idMap);

  return {
    slides: slideResult.slides,
    screens: screenResult.screens,
    playlistEntries: playlistResult.playlistEntries,
    warnings: [...slideResult.warnings, ...screenResult.warnings, ...playlistResult.warnings],
  };
};
