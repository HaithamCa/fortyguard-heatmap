import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { heatmapController } from "../controllers/heatmapController.js";
import { validateHeatmapPayloadObject } from "../validation/heatmap.validation.js";

const router = Router();

// Validation helper for polygon_aoi GeoJSON shapes supported by FortyGuard.
// Log incoming requests for this route (method, path, body)
function logHeatmapRequest(req: Request, _res: Response, next: NextFunction) {
	try {
		console.log("[heatmap] incoming", req.method, req.originalUrl, "body:", JSON.stringify(req.body));
	} catch (e) {
		console.log("[heatmap] incoming (unserializable body)");
	}
	return next();
}

function isGeoJsonPolygonAOI(obj: any): { valid: boolean; message?: string } {
	if (!obj || typeof obj !== "object") {
		return { valid: false, message: "Missing or invalid 'polygon_aoi'" };
	}

	const t = obj.type;
	if (!t || typeof t !== "string") {
		return { valid: false, message: "'polygon_aoi.type' is required and must be a string (FeatureCollection, Feature, or Polygon)" };
	}

	if (t === "FeatureCollection") {
		if (!Array.isArray(obj.features)) {
			return { valid: false, message: "FeatureCollection must include a 'features' array" };
		}
		return { valid: true };
	}

	if (t === "Feature") {
		if (!obj.geometry || typeof obj.geometry !== "object") {
			return { valid: false, message: "Feature must include a 'geometry' object" };
		}
		if (!obj.geometry.type) {
			return { valid: false, message: "Feature.geometry.type is required" };
		}
		return { valid: true };
	}

	if (t === "Polygon") {
		if (!Array.isArray(obj.coordinates)) {
			return { valid: false, message: "Polygon must include a 'coordinates' array" };
		}
		return { valid: true };
	}

	return { valid: false, message: "Unsupported 'polygon_aoi' type. Expected one of: FeatureCollection, Feature, Polygon." };
}

function validateHeatmapPayload(req: Request, res: Response, next: NextFunction) {
	try {
		validateHeatmapPayloadObject(req.body);
		return next();
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return res.status(400).json({ error: message });
	}
}

router.post("/heatmap", logHeatmapRequest, validateHeatmapPayload, heatmapController.submitHeatmap);

export default router;
