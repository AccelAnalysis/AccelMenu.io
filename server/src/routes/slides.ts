import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { authForMutations } from "../middleware/auth";
import {
  createSlideSchema,
  updateSlideSchema,
  idParamsSchema,
  reorderSlidesSchema,
} from "../validators/slide";

const router = Router();

router.use(authForMutations);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const slides = await prisma.slide.findMany({
      orderBy: { order: "asc" },
    });
    res.json(slides);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/reorder",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates = reorderSlidesSchema.parse(req.body);

      const transactions = updates.map((update) =>
        prisma.slide.update({
          where: { id: update.id },
          data: { order: update.order },
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
      const slide = await prisma.slide.findUnique({ where: { id } });

      if (!slide) {
        return res.status(404).json({ message: "Slide not found" });
      }

      res.json(slide);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSlideSchema.parse(req.body);
    const slide = await prisma.slide.create({ data });
    res.status(201).json(slide);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const data = updateSlideSchema.parse(req.body);
      const slide = await prisma.slide.update({ where: { id }, data });
      res.json(slide);
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
      await prisma.slide.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
