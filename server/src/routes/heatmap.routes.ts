import { Router } from "express";
import { heatmapController } from "../controllers/heatmapController.js";

const router = Router();

router.post("/heatmap", heatmapController.submitHeatmap);

export default router;
