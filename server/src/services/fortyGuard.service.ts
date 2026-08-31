import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * FortyGuard service
 * Responsible for calling the external FortyGuard API.
 * Exposes functions used by controllers:
 *  - submitHeatmap(payload)
 *  - getActivityStatus(id)
 *
 * Conceptual flow:
 * Express route -> Controller -> Service -> FortyGuard API
 */

export interface HeatmapPayload {
  userId?: string;
  events?: Array<Record<string, any>>;
  polygon_aoi?: Record<string, any>;
  date_time?: Record<string, any>;
  granularity?: number;
}

export interface ActivityStatus {
  id: string;
  status: string;
  lastSeen?: string;
  [key: string]: any;
}

function getConfig() {
  const BASE_URL = process.env.FORTYGUARD_BASE_URL;
  const API_KEY = process.env.FORTYGUARD_API_KEY;
  if (!BASE_URL || !API_KEY) {
    throw new Error("Missing FortyGuard configuration (FORTYGUARD_BASE_URL or FORTYGUARD_API_KEY)");
  }
  return { BASE_URL, API_KEY };
}

export async function submitHeatmap(payload: HeatmapPayload): Promise<any> {
  const { BASE_URL, API_KEY } = getConfig();
  const url = `${BASE_URL}/heatmap`;
  try {
    const res = await axios.post(url, payload, {
      headers: {
        // FortyGuard expects the API key in the `api-key` header.
        "api-key": API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    // Helpful debug: surface FortyGuard response when diagnosing integration issues.
    console.debug("FortyGuard submitHeatmap response:", res.status, res.data);
    // Some FortyGuard responses nest the useful payload under `data` (e.g. { data: { activity_id } }).
    // Return the inner `data` when present so controllers can read `activity_id` directly.
    return res.data?.data ?? res.data;
  } catch (err) {
    // Log upstream error details for debugging (non-sensitive parts).
    console.error("FortyGuard submitHeatmap error:", (err as any)?.response?.status, (err as any)?.response?.data ?? (err as any).message);
    throw err;
  }
}

export async function getActivityStatus(id: string): Promise<ActivityStatus> {
  const { BASE_URL, API_KEY } = getConfig();
  const url = `${BASE_URL}/activities/${encodeURIComponent(id)}`;
  const res = await axios.get(url, {
    headers: {
      "api-key": API_KEY,
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  return res.data as ActivityStatus;
}

export async function getStatus(id: string): Promise<{ status: number; data: any }> {
  const { BASE_URL, API_KEY } = getConfig();
  const url = `${BASE_URL}/status/${encodeURIComponent(id)}`;
  const headers = {
    "api-key": API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };

  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await axios.get(url, {
        headers,
        timeout: 60000,
      });
      console.debug("FortyGuard getStatus response:", res.status, res.data);
      const raw = res.data?.data ?? res.data;
      const transformed = transformFortyGuardData(raw);
      return { status: res.status, data: transformed };
    } catch (err) {
      lastErr = err;
      const code = (err as any)?.response?.status;
      const isTimeout =
        code === 504 ||
        code === 502 ||
        code === 503 ||
        (err as any)?.code === "ECONNABORTED" ||
        /timeout/i.test(String((err as any)?.message ?? ""));
      console.error(
        "FortyGuard getStatus error:",
        code,
        (err as any)?.response?.data ?? (err as any).message,
        `(attempt ${attempt}/${maxAttempts})`
      );
      if (!isTimeout || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}

function isNumber(n: any) {
  return typeof n === 'number' && Number.isFinite(n);
}

function findPoints(obj: any): Array<{ latitude: number; longitude: number; temperature?: number }> {
  const points: Array<any> = [];

  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      // check if array looks like points
      if (node.length > 0 && typeof node[0] === 'object') {
        const maybePoints = node.filter((it: any) => {
          const hasLatLon = (isNumber(it.latitude) && isNumber(it.longitude)) || (isNumber(it.lat) && isNumber(it.lon)) || (Array.isArray(it.coordinates) && it.coordinates.length >= 2 && isNumber(it.coordinates[0]) && isNumber(it.coordinates[1]));
          const hasTemp = isNumber(it.temperature) || isNumber(it.temp) || isNumber(it.value);
          return hasLatLon && hasTemp;
        });
        if (maybePoints.length > 0) {
          maybePoints.forEach((it: any) => {
            const lat = isNumber(it.latitude) ? it.latitude : (isNumber(it.lat) ? it.lat : (Array.isArray(it.coordinates) ? it.coordinates[1] : null));
            const lon = isNumber(it.longitude) ? it.longitude : (isNumber(it.lon) ? it.lon : (Array.isArray(it.coordinates) ? it.coordinates[0] : null));
            const temp = isNumber(it.temperature) ? it.temperature : (isNumber(it.temp) ? it.temp : (isNumber(it.value) ? it.value : undefined));
            if (isNumber(lat) && isNumber(lon)) points.push({ latitude: lat, longitude: lon, temperature: temp });
          });
        }
      }
      // recurse
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  }

  walk(obj);
  return points;
}

function findGeoJSON(obj: any): any | null {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.type === 'Feature' || obj.type === 'FeatureCollection' || obj.type === 'Polygon' || obj.type === 'MultiPolygon') return obj;
  if (obj.geojson) return obj.geojson;
  for (const v of Object.values(obj)) {
    if (typeof v === 'object') {
      const found = findGeoJSON(v as any);
      if (found) return found;
    }
  }
  return null;
}

function polygonCentroid(coords: any): { latitude: number; longitude: number } | null {
  // GeoJSON polygon coordinates: [ [ [lng, lat], ... ] ]
  const ring = Array.isArray(coords) && Array.isArray(coords[0]) ? coords[0] : null;
  if (!ring || ring.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  let n = 0;
  for (const pt of ring) {
    if (Array.isArray(pt) && isNumber(pt[0]) && isNumber(pt[1])) {
      sumLng += pt[0];
      sumLat += pt[1];
      n += 1;
    }
  }
  if (!n) return null;
  return { latitude: sumLat / n, longitude: sumLng / n };
}

function transformFortyGuardData(raw: any) {
  // Default: include raw under `raw` so frontend can inspect
  const out: any = { raw };

  // Surface FG activity status at top level (e.g. "Completed" / "Processing")
  if (raw?.status) out.status = String(raw.status).toLowerCase();
  if (raw?.activity_id) out.activity_id = raw.activity_id;

  const result = raw?.result ?? raw;
  const mapData = result?.map_data;
  const statsData = result?.stats_data;

  // Prefer official map_data GeoJSON when present
  if (mapData && (mapData.type === 'FeatureCollection' || mapData.type === 'Feature' || mapData.type === 'Polygon')) {
    out.geojson = mapData;
  } else {
    const geojson = findGeoJSON(raw);
    if (geojson) out.geojson = geojson;
  }

  // Official stats_data.temperature_stats → summary
  const tempStats = statsData?.temperature_stats ?? statsData?.Temperature_stats;
  if (tempStats && typeof tempStats === 'object') {
    const min = tempStats.minimum ?? tempStats.Minimum;
    const max = tempStats.maximum ?? tempStats.Maximum;
    const avg = tempStats.mean ?? tempStats.Mean ?? tempStats.average;
    out.summary = {
      minimum: isNumber(min) ? Math.round(min * 10) / 10 : min,
      maximum: isNumber(max) ? Math.round(max * 10) / 10 : max,
      average: isNumber(avg) ? Math.round(avg * 10) / 10 : avg,
    };
  }

  // Build temperature points from map_data polygon tiles, then keep a mix of
  // hottest / near-average / coolest so the UI is not only orange (max) markers.
  if (mapData?.features && Array.isArray(mapData.features) && mapData.features.length > 0) {
    const allPoints = mapData.features
      .map((f: any) => {
        const props = f?.properties ?? {};
        const temp =
          props.average_temperature ??
          props.max_temperature ??
          props.temperature ??
          props.value;
        const center = polygonCentroid(f?.geometry?.coordinates);
        if (!center || !isNumber(temp)) return null;
        return {
          latitude: center.latitude,
          longitude: center.longitude,
          temperature: Math.round(temp * 10) / 10,
          label: props.tile_id != null ? `Tile ${props.tile_id}` : undefined,
        };
      })
      .filter(Boolean) as Array<{ latitude: number; longitude: number; temperature: number; label?: string }>;

    if (allPoints.length > 0) {
      const sorted = [...allPoints].sort((a, b) => b.temperature - a.temperature);
      const avgTarget =
        out.summary?.average ??
        sorted.reduce((s, p) => s + p.temperature, 0) / sorted.length;

      const hottest = { ...sorted[0], kind: 'maximum', label: 'Highest temperature' };
      const coolest = {
        ...sorted[sorted.length - 1],
        kind: 'minimum',
        label: 'Lowest temperature',
      };
      const nearAvg = [...sorted].sort(
        (a, b) => Math.abs(a.temperature - avgTarget) - Math.abs(b.temperature - avgTarget)
      )[0];
      const averagePoint = {
        ...nearAvg,
        kind: 'average',
        label: 'Near average temperature',
      };

      // Spread sample across the full temperature range (not only the hottest)
      const sampleBudget = Math.min(60, sorted.length);
      const sampled: typeof sorted = [];
      if (sorted.length <= sampleBudget) {
        sampled.push(...sorted);
      } else {
        for (let i = 0; i < sampleBudget; i++) {
          const idx = Math.round((i * (sorted.length - 1)) / (sampleBudget - 1));
          sampled.push(sorted[idx]);
        }
      }

      const key = (p: { latitude: number; longitude: number }) =>
        `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
      const byKey = new Map<string, any>();
      for (const p of sampled) byKey.set(key(p), p);
      // Ensure min / avg / max markers always present
      byKey.set(key(coolest), coolest);
      byKey.set(key(averagePoint), averagePoint);
      byKey.set(key(hottest), hottest);

      out.hotspots = Array.from(byKey.values()).sort(
        (a, b) => b.temperature - a.temperature
      );
      out.keyTemperatures = { minimum: coolest, average: averagePoint, maximum: hottest };
    }
  }

  // Fallback: recursive point hunt in older/alternate shapes
  if (!out.hotspots || !out.summary) {
    const points = findPoints(raw);
    if (points && points.length > 0) {
      const temps = points.map((p) => p.temperature).filter(isNumber) as number[];
      if (!out.summary && temps.length > 0) {
        const sum = temps.reduce((s, v) => s + v, 0);
        out.summary = {
          minimum: Math.min(...temps),
          maximum: Math.max(...temps),
          average: Math.round((sum / temps.length) * 10) / 10,
        };
      }
      if (!out.hotspots) {
        out.hotspots = points
          .filter((p) => isNumber(p.temperature))
          .sort((a, b) => (b.temperature as number) - (a.temperature as number))
          .slice(0, 50)
          .map((p) => ({ latitude: p.latitude, longitude: p.longitude, temperature: p.temperature }));
      }
    }
  }

  // Empty US-outside / no-data completion: keep status + raw for debugging
  if (!out.summary && !out.hotspots && !(out.geojson?.features?.length > 0)) {
    return out;
  }

  return out;
}

export default {
  submitHeatmap,
  getActivityStatus,
  getStatus,
};
