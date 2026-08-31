export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

export type HeatmapPayload = {
  polygon_aoi?: GeoJSONPolygon | Record<string, any>;
  date_time: { start_date: string; start_time: string; filter_type: number };
  granularity: number;
  [key: string]: any;
};
