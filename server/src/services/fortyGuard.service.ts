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
  const url = `${BASE_URL}/heatmaps`;
  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function getActivityStatus(id: string): Promise<ActivityStatus> {
  const { BASE_URL, API_KEY } = getConfig();
  const url = `${BASE_URL}/activities/${encodeURIComponent(id)}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  return res.data as ActivityStatus;
}

export default {
  submitHeatmap,
  getActivityStatus,
};
