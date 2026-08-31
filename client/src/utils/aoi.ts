export function bboxToPolygon([minX, minY, maxX, maxY]: [number, number, number, number]) {
  // Returns a GeoJSON Polygon for the given bbox: [minX, minY, maxX, maxY]
  return {
    type: "Polygon",
    coordinates: [[
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY]
    ]]
  } as const;
}

export default bboxToPolygon;
