import axios from "axios";

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
  userId: string;
  events: Array<Record<string, any>>;
}

export interface ActivityStatus {
  id: string;
  status: string;
  lastSeen?: string;
  [key: string]: any;
}

const BASE_URL = process.env.FORTYGUARD_BASE_URL;
const API_KEY = process.env.FORTYGUARD_API_KEY;

function ensureConfig(): void {
  if (!BASE_URL || !API_KEY) {
    throw new Error("Missing FortyGuard configuration (FORTYGUARD_BASE_URL or FORTYGUARD_API_KEY)");
  }
}

export async function submitHeatmap(payload: HeatmapPayload): Promise<any> {
  ensureConfig();
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
  ensureConfig();
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
