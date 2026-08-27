import type { Request, Response } from "express";
import service from "../services/service.js";

export const heatmapController = {
  async submitHeatmap(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const result = await service.submitHeatmap(payload);
      const activityId = result?.activity_id ?? result?.activityId ?? null;
      if (!activityId) {
        res.status(502).json({ error: "Invalid response from FortyGuard" });
        return;
      }
      res.status(200).json({ activityId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("submitHeatmap error:", err);
      res.status(500).json({ error: "Failed to submit heatmap", details: msg });
    }
  },
};

export default heatmapController;
