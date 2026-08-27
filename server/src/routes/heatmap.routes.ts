import { Router, Request, Response, NextFunction } from "express";
import { heatmapController } from "../controllers/heatmapController.js";

const router = Router();

// Basic validation middleware for the heatmap payload.
function validateHeatmapPayload(req: Request, res: Response, next: NextFunction) {
	const { polygon_aoi, date_time, granularity } = req.body ?? {};

	if (!polygon_aoi || typeof polygon_aoi !== "object") {
		return res.status(400).json({ error: "Missing or invalid 'polygon_aoi'" });
	}

	if (!date_time || typeof date_time !== "object") {
		return res.status(400).json({ error: "Missing or invalid 'date_time'" });
	}

	const { start_date, start_time, filter_type } = date_time;
	if (!start_date || typeof start_date !== "string") {
		return res.status(400).json({ error: "Missing or invalid 'date_time.start_date'" });
	}
	if (!start_time || typeof start_time !== "string") {
		return res.status(400).json({ error: "Missing or invalid 'date_time.start_time'" });
	}
	if (filter_type === undefined || typeof filter_type !== "number") {
		return res.status(400).json({ error: "Missing or invalid 'date_time.filter_type'" });
	}

	if (granularity === undefined || typeof granularity !== "number") {
		return res.status(400).json({ error: "Missing or invalid 'granularity'" });
	}

	return next();
}

router.post("/heatmap", validateHeatmapPayload, heatmapController.submitHeatmap);

export default router;
