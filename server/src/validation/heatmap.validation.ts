import type { HeatmapPayload } from "../services/fortyGuard.service.js";

function isGeoJsonPolygonAOI(obj: any): { valid: boolean; message?: string } {
  if (!obj || typeof obj !== "object") {
    // allow empty object as shorthand (relaxed rule)
    if (Object.keys(obj ?? {}).length === 0) return { valid: true };
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

export function validateHeatmapPayloadObject(payload: unknown) {
  const body = (payload ?? {}) as HeatmapPayload;
  const { polygon_aoi, date_time, granularity } = body;

  const aoiCheck = isGeoJsonPolygonAOI(polygon_aoi as any);
  if (!aoiCheck.valid) throw new Error(aoiCheck.message);

  if (!date_time || typeof date_time !== "object") {
    throw new Error("Missing or invalid 'date_time'");
  }

  const { start_date, start_time, filter_type } = date_time as any;
  if (!start_date || typeof start_date !== "string") {
    throw new Error("Missing or invalid 'date_time.start_date'");
  }
  if (!start_time || typeof start_time !== "string") {
    throw new Error("Missing or invalid 'date_time.start_time'");
  }
  if (filter_type === undefined || typeof filter_type !== "number") {
    throw new Error("Missing or invalid 'date_time.filter_type'");
  }

  if (granularity === undefined || typeof granularity !== "number") {
    throw new Error("Missing or invalid 'granularity'");
  }

  return true;
}

export default { validateHeatmapPayloadObject };
