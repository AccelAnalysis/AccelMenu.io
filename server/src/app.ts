import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import slidesRouter from "./routes/slides";
import screensRouter from "./routes/screens";
import playlistsRouter from "./routes/playlists";
import importExportRouter from "./routes/importExport";
import errorHandler from "./middleware/errorHandler";

const app = express();

const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : undefined,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/slides", slidesRouter);
app.use("/api/screens", screensRouter);
app.use("/api/playlists", playlistsRouter);
app.use("/api", importExportRouter);

app.use(errorHandler);

export default app;
