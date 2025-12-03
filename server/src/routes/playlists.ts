import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
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

      const transactions = updates.map((update) =>
        prisma.playlistEntry.update({
          where: { id: update.id },
          data: { position: update.position },
        })
      );

      const result = await prisma.$transaction(transactions);
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
    const playlistEntry = await prisma.playlistEntry.create({ data });
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
      const playlistEntry = await prisma.playlistEntry.update({ where: { id }, data });
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
      await prisma.playlistEntry.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
