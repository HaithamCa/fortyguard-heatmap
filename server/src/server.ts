import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import heatmapRoutes from "./routes/heatmap.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(cors());
app.use(express.json());

// mount API routes
app.use("/api", heatmapRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FortyGuard backend is running",
  });
});

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});