import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import slidesRouter from "./routes/slides";
import screensRouter from "./routes/screens";
import playlistsRouter from "./routes/playlists";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/slides", slidesRouter);
app.use("/api/screens", screensRouter);
app.use("/api/playlists", playlistsRouter);

app.use(errorHandler);

export default app;
