import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import {
  createScreenSchema,
  updateScreenSchema,
  idParamsSchema,
} from "../validators/screen";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const screens = await prisma.screen.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(screens);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createScreenSchema.parse(req.body);
    const screen = await prisma.screen.create({ data });
    res.status(201).json(screen);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const screen = await prisma.screen.findUnique({ where: { id } });

      if (!screen) {
        return res.status(404).json({ message: "Screen not found" });
      }

      res.json(screen);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = idParamsSchema.parse(req.params);
      const data = updateScreenSchema.parse(req.body);
      const screen = await prisma.screen.update({ where: { id }, data });
      res.json(screen);
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
      await prisma.screen.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
