import { Router, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import prisma from "../lib/prisma";
import { authForMutations } from "../middleware/auth";
import { ImportBundleInput, importBundleSchema } from "../validators/importExport";
import { parseLegacyBundle } from "../lib/legacyImport";

const router = Router();

router.use(authForMutations);

const normalizeSlides = (slides: ImportBundleInput["slides"]) =>
  slides.map((slide, index) => ({
    id: typeof slide.id === "string" ? slide.id : randomUUID(),
    title:
      typeof slide.title === "string" && slide.title.length > 0
        ? slide.title
        : typeof slide.name === "string" && slide.name.length > 0
          ? slide.name
          : `Slide ${index + 1}`,
    content: slide.content ?? slide.elements ?? slide,
    mediaUrl: typeof slide.mediaUrl === "string" ? slide.mediaUrl : null,
    duration:
      typeof slide.duration === "number" && slide.duration >= 0
        ? Math.round(slide.duration)
        : 15000,
    order:
      typeof slide.order === "number"
        ? Math.round(slide.order)
        : typeof slide.position === "number"
          ? Math.round(slide.position)
          : index,
  }));

const normalizeScreens = (screens: ImportBundleInput["screens"]) =>
  screens.map((screen, index) => ({
    id: typeof screen.id === "string" ? screen.id : randomUUID(),
    name:
      typeof screen.name === "string" && screen.name.length > 0
        ? screen.name
        : `Screen ${index + 1}`,
    location:
      typeof screen.location === "string" && screen.location.length > 0
        ? screen.location
        : screen.placement ?? "",
    rotation:
      typeof screen.rotation === "number" && screen.rotation > 0
        ? Math.round(screen.rotation)
        : 15000,
    x: typeof screen.x === "number" ? Math.round(screen.x) : 0,
    y: typeof screen.y === "number" ? Math.round(screen.y) : 0,
    status: screen.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  }));

const normalizePlaylistEntries = (
  payload: ImportBundleInput,
  screens: ReturnType<typeof normalizeScreens>,
  slides: ReturnType<typeof normalizeSlides>
) => {
  const screenIds = new Set(screens.map((screen) => screen.id));
  const slideIds = new Set(slides.map((slide) => slide.id));

  if (Array.isArray(payload.playlistEntries) && payload.playlistEntries.length) {
    return payload.playlistEntries
      .map((entry, index) => ({
        id: typeof entry.id === "string" ? entry.id : randomUUID(),
        screenId: entry.screenId,
        slideId: entry.slideId,
        position:
          typeof entry.position === "number"
            ? Math.round(entry.position)
            : index,
        active: entry.active ?? true,
      }))
      .filter((entry) => screenIds.has(entry.screenId) && slideIds.has(entry.slideId));
  }

  const playlists: { screenId: string; slides: string[] }[] = Array.isArray(
    payload.playlists
  )
    ? payload.playlists.map((playlist) => ({
        screenId: playlist.screenId,
        slides: playlist.slides || playlist.slideIds || [],
      }))
    : [];

  if (playlists.length === 0) {
    payload.screens?.forEach((screen) => {
      if (Array.isArray(screen.slides)) {
        playlists.push({ screenId: screen.id, slides: screen.slides });
      }
    });
  }

  return playlists.flatMap((playlist) =>
    (playlist.slides || [])
      .filter((slideId) => screenIds.has(playlist.screenId) && slideIds.has(slideId))
      .map((slideId, index) => ({
        id: randomUUID(),
        screenId: playlist.screenId,
        slideId,
        position: index,
        active: true,
      }))
  );
};

const buildLegacyExportBundle = (
  slides: Awaited<ReturnType<typeof prisma.slide.findMany>>,
  screens: Awaited<ReturnType<typeof prisma.screen.findMany>>,
  playlistEntries: Awaited<ReturnType<typeof prisma.playlistEntry.findMany>>
) => {
  const orderedEntries = [...playlistEntries].sort((a, b) => a.position - b.position);

  const playlistsByScreen = orderedEntries.reduce<Record<string, string[]>>((acc, entry) => {
    if (!acc[entry.screenId]) {
      acc[entry.screenId] = [];
    }
    acc[entry.screenId].push(entry.slideId);
    return acc;
  }, {});

  return {
    exportedAt: new Date().toISOString(),
    slides: slides.map((slide) => ({
      id: slide.id,
      uuid: slide.id,
      key: slide.id,
      title: slide.title,
      name: slide.title,
      content: slide.content,
      body: slide.content,
      elements: slide.content,
      mediaUrl: slide.mediaUrl,
      media: slide.mediaUrl,
      duration: slide.duration,
      durationMs: slide.duration,
      durationSeconds: slide.duration,
      order: slide.order,
      position: slide.order,
    })),
    screens: screens.map((screen) => ({
      id: screen.id,
      uuid: screen.id,
      name: screen.name,
      location: screen.location,
      placement: screen.location,
      rotation: screen.rotation,
      x: screen.x,
      y: screen.y,
      status: screen.status,
      slides: playlistsByScreen[screen.id] ?? [],
    })),
    playlists: Object.entries(playlistsByScreen).map(([screenId, slidesForScreen]) => ({
      screenId,
      slides: slidesForScreen,
    })),
    playlistEntries: orderedEntries.map((entry) => ({
      id: entry.id,
      screenId: entry.screenId,
      slideId: entry.slideId,
      position: entry.position,
      active: entry.active,
    })),
  } as const;
};

router.get("/export", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [slides, screens, playlistEntries] = await Promise.all([
      prisma.slide.findMany({ orderBy: { order: "asc" } }),
      prisma.screen.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.playlistEntry.findMany({ orderBy: { position: "asc" } }),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      slides,
      screens,
      playlistEntries,
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/export/legacy",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [slides, screens, playlistEntries] = await Promise.all([
        prisma.slide.findMany({ orderBy: { order: "asc" } }),
        prisma.screen.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.playlistEntry.findMany({ orderBy: { position: "asc" } }),
      ]);

      const payload = buildLegacyExportBundle(slides, screens, playlistEntries);

      const filename = `accelmenu-backup-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

      Readable.from([JSON.stringify(payload, null, 2)]).pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = importBundleSchema.parse(req.body);

    const slides = normalizeSlides(payload.slides || []);
    const screens = normalizeScreens(payload.screens || []);
    const playlistEntries = normalizePlaylistEntries(payload, screens, slides);

    await prisma.$transaction(async (tx) => {
      await tx.playlistEntry.deleteMany();
      await tx.screen.deleteMany();
      await tx.slide.deleteMany();

      if (slides.length) {
        await tx.slide.createMany({ data: slides });
      }

      if (screens.length) {
        await tx.screen.createMany({ data: screens });
      }

      if (playlistEntries.length) {
        await tx.playlistEntry.createMany({ data: playlistEntries });
      }
    });

    res.status(201).json({
      message: "Import completed",
      counts: {
        slides: slides.length,
        screens: screens.length,
        playlistEntries: playlistEntries.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/import/legacy", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = parseLegacyBundle(req.body);

    const summary = {
      inserted: { slides: 0, screens: 0, playlistEntries: 0 },
      skipped: { slides: 0, screens: 0, playlistEntries: 0 },
    };

    const warnings = [...parsed.warnings];

    await prisma.$transaction(async (tx) => {
      const existingSlides = await tx.slide.findMany({
        where: { id: { in: parsed.slides.map((slide) => slide.id) } },
        select: { id: true },
      });

      const slideIds = new Set(existingSlides.map((slide) => slide.id));
      const slidesToInsert = parsed.slides.filter((slide) => {
        if (slideIds.has(slide.id)) {
          summary.skipped.slides += 1;
          return false;
        }

        slideIds.add(slide.id);
        return true;
      });

      if (slidesToInsert.length) {
        await tx.slide.createMany({ data: slidesToInsert });
        summary.inserted.slides = slidesToInsert.length;
      }

      const existingScreens = await tx.screen.findMany({
        where: { id: { in: parsed.screens.map((screen) => screen.id) } },
        select: { id: true },
      });

      const screenIds = new Set(existingScreens.map((screen) => screen.id));
      const screensToInsert = parsed.screens.filter((screen) => {
        if (screenIds.has(screen.id)) {
          summary.skipped.screens += 1;
          return false;
        }

        screenIds.add(screen.id);
        return true;
      });

      if (screensToInsert.length) {
        await tx.screen.createMany({ data: screensToInsert });
        summary.inserted.screens = screensToInsert.length;
      }

      const existingPlaylistEntries = await tx.playlistEntry.findMany({
        where: { id: { in: parsed.playlistEntries.map((entry) => entry.id) } },
        select: { id: true, screenId: true, position: true },
      });

      const playlistEntryIds = new Set(existingPlaylistEntries.map((entry) => entry.id));
      const playlistEntryKeys = new Set(
        existingPlaylistEntries.map((entry) => `${entry.screenId}:${entry.position}`)
      );

      const playlistEntriesToInsert: typeof parsed.playlistEntries = [];

      parsed.playlistEntries.forEach((entry) => {
        if (!screenIds.has(entry.screenId) || !slideIds.has(entry.slideId)) {
          summary.skipped.playlistEntries += 1;
          warnings.push(
            `Skipping playlist entry for screen ${entry.screenId} and slide ${entry.slideId} due to missing references.`
          );
          return;
        }

        const dedupeKey = `${entry.screenId}:${entry.position}`;

        if (playlistEntryIds.has(entry.id) || playlistEntryKeys.has(dedupeKey)) {
          summary.skipped.playlistEntries += 1;
          warnings.push(
            `Skipping duplicate playlist entry for screen ${entry.screenId} at position ${entry.position}.`
          );
          return;
        }

        playlistEntryIds.add(entry.id);
        playlistEntryKeys.add(dedupeKey);
        playlistEntriesToInsert.push(entry);
      });

      if (playlistEntriesToInsert.length) {
        await tx.playlistEntry.createMany({ data: playlistEntriesToInsert });
        summary.inserted.playlistEntries = playlistEntriesToInsert.length;
      }
    });

    if (warnings.length) {
      console.warn("Legacy import warnings", warnings);
    }

    console.info("Legacy import completed", summary);

    res.status(201).json({
      message: "Legacy import completed",
      counts: summary,
      warnings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
