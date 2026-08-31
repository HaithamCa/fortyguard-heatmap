import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import heatmapRoutes from "./routes/heatmap.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Local: prefer server/.env then repo root .env. On Vercel, platform env wins.
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", heatmapRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FortyGuard backend is running",
  });
});

export default app;
