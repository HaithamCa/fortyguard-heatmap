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
  try {
    const res = await axios.get(url, {
      headers: {
        "api-key": API_KEY,
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    console.debug("FortyGuard getStatus response:", res.status, res.data);
    return { status: res.status, data: res.data?.data ?? res.data };
  } catch (err) {
    console.error("FortyGuard getStatus error:", (err as any)?.response?.status, (err as any)?.response?.data ?? (err as any).message);
    throw err;
  }
}

export default {
  submitHeatmap,
  getActivityStatus,
  getStatus,
};
