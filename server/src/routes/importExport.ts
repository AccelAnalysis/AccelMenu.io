import { Router, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { authForMutations } from "../middleware/auth";
import { ImportBundleInput, importBundleSchema } from "../validators/importExport";

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

export default router;
