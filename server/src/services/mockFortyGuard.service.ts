/**
 * In-memory mock FortyGuard responses for offline demo / UI testing.
 * Enable with DEV_MOCK=true in the root .env file.
 */

const pollCounts = new Map<string, number>();

function pollsBeforeComplete(): number {
  const n = Number(process.env.MOCK_POLLS_BEFORE_COMPLETE ?? 2);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 2;
}

export function createMockActivityId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCompletedMock(activityId: string) {
  const hotspots = [
    { latitude: 43.6532, longitude: -79.3832, temperature: 36.8, label: "Downtown core" },
    { latitude: 43.6629, longitude: -79.3957, temperature: 35.4, label: "University district" },
    { latitude: 43.6426, longitude: -79.3871, temperature: 34.9, label: "Waterfront east" },
    { latitude: 43.6677, longitude: -79.3948, temperature: 33.6, label: "Yorkville" },
    { latitude: 43.6488, longitude: -79.3714, temperature: 32.1, label: "Distillery district" },
    { latitude: 43.6763, longitude: -79.4103, temperature: 31.4, label: "Annex" },
    { latitude: 43.6389, longitude: -79.4065, temperature: 30.8, label: "Liberty Village" },
    { latitude: 43.6708, longitude: -79.3865, temperature: 29.5, label: "Rosedale" },
  ];

  const temps = hotspots.map((h) => h.temperature);
  const min = Math.round((Math.min(...temps) - 2.4) * 10) / 10;
  const max = Math.max(...temps);
  const avg = Math.round((temps.reduce((s, v) => s + v, 0) / temps.length) * 10) / 10;

  return {
    status: "completed",
    activity_id: activityId,
    summary: { minimum: min, maximum: max, average: avg },
    hotspots,
    geojson: {
      type: "FeatureCollection",
      features: hotspots.map((h) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [h.longitude, h.latitude] },
        properties: { temperature: h.temperature, label: h.label },
      })),
    },
  };
}

export function getMockStatus(activityId: string): { httpStatus: number; data: Record<string, unknown> } {
  if (!activityId.startsWith("mock-")) {
    return {
      httpStatus: 404,
      data: { status: "error", error: "Unknown mock activity", activityId },
    };
  }

  const count = (pollCounts.get(activityId) ?? 0) + 1;
  pollCounts.set(activityId, count);

  const required = pollsBeforeComplete();
  if (count < required) {
    const progress = Math.round((count / required) * 100);
    return {
      httpStatus: 202,
      data: {
        status: "processing",
        activity_id: activityId,
        progress,
        message: `Mock analysis in progress (poll ${count}/${required})`,
      },
    };
  }

  pollCounts.delete(activityId);
  return { httpStatus: 200, data: buildCompletedMock(activityId) };
}

export function resetMockState(): void {
  pollCounts.clear();
}
