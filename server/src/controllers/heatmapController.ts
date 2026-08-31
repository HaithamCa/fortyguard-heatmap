import type { Request, Response } from "express";
import service from "../services/fortyGuard.service.js";
import { createMockActivityId, getMockStatus } from "../services/mockFortyGuard.service.js";

export const heatmapController = {
  async submitHeatmap(req: Request, res: Response): Promise<void> {
    try {
      // Dev mock mode bypasses external API for local frontend integration.
      if (process.env.DEV_MOCK === "true") {
        const mockId = createMockActivityId();
        console.log("[heatmap] DEV_MOCK submit", { activityId: mockId });
        res.status(200).json({ activityId: mockId });
        return;
      }

      const { polygon_aoi, date_time, granularity, ...rest } = req.body as any;
      const payload: any = { polygon_aoi, date_time, granularity, ...rest };

      // Forward the payload as-is (do not strip `polygon_aoi` here).
      // FortyGuard will validate and return an error if the AOI is missing or malformed.
      const result = await service.submitHeatmap(payload);

      // Map FortyGuard's activity_id to frontend-friendly activityId
      const activityId = result?.activity_id ?? result?.activityId ?? null;
      if (!activityId) {
          res.status(502).json({ error: "Invalid response from FortyGuard", details: result });
        return;
      }
      res.status(200).json({ activityId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("submitHeatmap error:", err);
      // If FortyGuard returned a 4xx, try to surface the message to the client when safe
      if ((err as any)?.response?.status >= 400 && (err as any)?.response?.status < 500) {
        const fgDetails = (err as any)?.response?.data ?? { message: msg };
        res.status((err as any).response.status).json({ error: "FortyGuard error", details: fgDetails });
        return;
      }
      res.status(500).json({ error: "Failed to submit heatmap", details: msg });
    }
  },
  async getStatus(req: Request, res: Response): Promise<void> {
    const started = Date.now();
    try {
      const { activityId } = req.params as { activityId: string };

      if (process.env.DEV_MOCK === "true") {
        const mockResult = getMockStatus(activityId);
        console.log("[heatmap] DEV_MOCK status", {
          activityId,
          httpStatus: mockResult.httpStatus,
          status: mockResult.data.status,
          elapsedMs: Date.now() - started,
        });
        res.status(mockResult.httpStatus).json(mockResult.data);
        return;
      }

      const result = await service.getStatus(activityId);
      console.log("[heatmap] status", {
        activityId,
        httpStatus: result?.status,
        elapsedMs: Date.now() - started,
        hasSummary: Boolean(result?.data?.summary),
        hotspotCount: Array.isArray(result?.data?.hotspots) ? result.data.hotspots.length : 0,
      });

      if (result && typeof result === "object" && typeof result.status === "number") {
        res.status(result.status).json(result.data);
        return;
      }

      // Fallback: return 200 with whatever the service returned
      res.status(200).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const upstreamStatus = (err as any)?.response?.status;
      console.error("getStatus error:", upstreamStatus ?? msg);
      if (upstreamStatus >= 400 && upstreamStatus < 500) {
        const fgDetails = (err as any)?.response?.data ?? { message: msg };
        res.status(upstreamStatus).json({ error: "FortyGuard error", details: fgDetails });
        return;
      }
      // Upstream timeouts / gateway errors — keep UI polling without failing
      if (
        upstreamStatus === 502 ||
        upstreamStatus === 503 ||
        upstreamStatus === 504 ||
        !upstreamStatus
      ) {
        res.status(200).json({
          status: "processing",
          error: "upstream_timeout",
          message: "FortyGuard status timed out; still processing. Retrying…",
          activity_id: (req.params as { activityId: string }).activityId,
        });
        return;
      }
      res.status(500).json({ error: "Failed to get status", details: msg });
    }
  },
};

export default heatmapController;
