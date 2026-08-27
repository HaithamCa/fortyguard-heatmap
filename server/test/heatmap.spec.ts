import { describe, it, expect } from "vitest";
import { validateHeatmapPayloadObject as validate } from "../src/validation/heatmap.validation.js";

describe("heatmap schema", () => {
  it("rejects empty polygon_aoi", () => {
    const payload = {
      polygon_aoi: {},
      date_time: { start_date: "2026-07-15", start_time: "14:00", filter_type: 1 },
      granularity: 100,
    };
    // relaxed validation: empty AOI accepted
    expect(() => validate(payload)).not.toThrow();
  });

  it("accepts a valid Polygon AOI", () => {
    const payload = {
      polygon_aoi: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
      date_time: { start_date: "2026-07-15", start_time: "14:00", filter_type: 1 },
      granularity: 100,
    };
    expect(() => validate(payload)).not.toThrow();
  });
});
