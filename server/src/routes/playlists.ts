import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { normalizePlaylistPositions } from "../lib/ordering";
import { authForMutations } from "../middleware/auth";
import {
  createPlaylistEntrySchema,
  updatePlaylistEntrySchema,
  idParamsSchema,
  reorderPlaylistEntriesSchema,
} from "../validators/playlist";

const router = Router();

router.use(authForMutations);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistEntries = await prisma.playlistEntry.findMany({
      orderBy: { position: "asc" },
      include: { screen: true, slide: true },
    });
    res.json(playlistEntries);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/reorder",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates = reorderPlaylistEntriesSchema.parse(req.body);
      const ids = updates.map((update) => update.id);

      const entries = await prisma.playlistEntry.findMany({
        where: { id: { in: ids } },
        select: { id: true, screenId: true },
      });

      if (entries.length !== updates.length) {
        return res
          .status(404)
          .json({ message: "One or more playlist entries not found" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedEntries = await Promise.all(
          updates.map((update) =>
            tx.playlistEntry.update({
              where: { id: update.id },
              data: { position: update.position },
            })
          )
        );

        const screensToNormalize = new Set(entries.map((entry) => entry.screenId));
        await Promise.all(
          [...screensToNormalize].map((screenId) =>
            normalizePlaylistPositions(screenId, tx, false)
          )
        );

        return updatedEntries;
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const playlistEntry = await prisma.playlistEntry.findUnique({
        where: { id },
        include: { screen: true, slide: true },
      });

      if (!playlistEntry) {
        return res.status(404).json({ message: "Playlist entry not found" });
      }

      res.json(playlistEntry);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPlaylistEntrySchema.parse(req.body);

    const playlistEntry = await prisma.$transaction(async (tx) => {
      const created = await tx.playlistEntry.create({ data });
      await normalizePlaylistPositions(data.screenId, tx, false);
      return created;
    });

    res.status(201).json(playlistEntry);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const data = updatePlaylistEntrySchema.parse(req.body);

      const existing = await prisma.playlistEntry.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: "Playlist entry not found" });
      }

      const playlistEntry = await prisma.$transaction(async (tx) => {
        const updated = await tx.playlistEntry.update({ where: { id }, data });

        const screensToNormalize = new Set([
          existing.screenId,
          data.screenId ?? existing.screenId,
        ]);

        await Promise.all(
          [...screensToNormalize].map((screenId) =>
            normalizePlaylistPositions(screenId, tx, false)
          )
        );

        return updated;
      });

      res.json(playlistEntry);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);

      const playlistEntry = await prisma.playlistEntry.findUnique({ where: { id } });
      if (!playlistEntry) {
        return res.status(404).json({ message: "Playlist entry not found" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.playlistEntry.delete({ where: { id } });
        await normalizePlaylistPositions(playlistEntry.screenId, tx, false);
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
