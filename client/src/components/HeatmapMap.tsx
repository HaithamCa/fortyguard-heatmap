import React from 'react';
import { MapContainer, TileLayer, useMapEvents, Polygon, Marker, Popup, CircleMarker, GeoJSON, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import {
  classifyRisk,
  RISK_BANDS,
  KEY_TEMP_COLORS,
  heatScaleColor,
  colorForPoint,
  type TempRange,
} from '../utils/risk';

type Props = {
  hotspots?: Array<any>;
  geojson?: any;
  tempRange?: TempRange | null;
  onPolygonComplete?: (geojson: any) => void;
  clearSignal?: number;
  selectedHotspot?: any;
  compact?: boolean;
};

function ClickHandler({ points, setPoints }: { points: LatLngExpression[]; setPoints: (p: LatLngExpression[]) => void }) {
  useMapEvents({
    click(e) {
      const latlng: LatLngExpression = [e.latlng.lat, e.latlng.lng];
      setPoints([...points, latlng]);
    },
  });
  return null;
}

function Legend({ range }: { range?: TempRange | null }) {
  useMap();
  return (
    <div className="hs-legend">
      <strong>Temperature</strong>
      <div className="hs-legend-bar" />
      <div className="hs-scale-hint">
        <span>Cooler</span>
        <span>Hotter</span>
      </div>
      {range && (
        <div className="hs-scale-hint" style={{ marginTop: 2 }}>
          <span>{range.min}°C</span>
          <span>{range.max}°C</span>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        {RISK_BANDS.map((b) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <div style={{ width: 14, height: 10, background: b.color, borderRadius: 3 }} />
            <div>
              {b.meaning} <span style={{ color: '#64748b' }}>({b.range})</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: KEY_TEMP_COLORS.minimum }} /> Min
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: KEY_TEMP_COLORS.average }} /> Avg
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: KEY_TEMP_COLORS.maximum }} /> Max
        </div>
      </div>
    </div>
  );
}

export default function HeatmapMap({ hotspots, geojson, tempRange, onPolygonComplete, compact }: Props) {
  const [points, setPoints] = React.useState<LatLngExpression[]>([]);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [mapInstance, setMapInstance] = React.useState<any | null>(null);
  const [highlight, setHighlight] = React.useState<any | null>(null);

  const mapCenter: LatLngExpression = [40.7128, -74.006];

  const handleFinish = () => {
    if (points.length < 3) {
      setLocalError('Please draw a valid area.');
      return;
    }
    setLocalError(null);
    const coords = points.map((p: any) => [p[1], p[0]]);
    if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]);
    }
    onPolygonComplete?.({ type: 'Polygon', coordinates: [coords] });
  };

  const handleClear = () => setPoints([]);

  React.useEffect(() => {
    function handler() {
      setPoints([]);
    }
    window.addEventListener('heatmap.clear', handler as EventListener);
    return () => window.removeEventListener('heatmap.clear', handler as EventListener);
  }, []);

  React.useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const lat = detail.latitude ?? detail.lat ?? (detail.coordinates ? detail.coordinates[1] : null);
      const lon = detail.longitude ?? detail.lon ?? (detail.coordinates ? detail.coordinates[0] : null);
      if (lat == null || lon == null) return;
      if (mapInstance) {
        try {
          mapInstance.setView([lat, lon], 16);
        } catch {
          // ignore
        }
      }
      const temp = detail.temperature ?? detail.temp ?? detail.value;
      setHighlight({
        latitude: lat,
        longitude: lon,
        temperature: temp,
        riskLabel: classifyRisk(temp).label,
        color: colorForPoint(detail, tempRange),
      });
      setTimeout(() => setHighlight(null), 8000);
    }
    window.addEventListener('heatmap.select', handler as EventListener);
    return () => window.removeEventListener('heatmap.select', handler as EventListener);
  }, [mapInstance, tempRange]);

  return (
    <div>
      <div className="hs-map-shell" style={{ height: compact ? 280 : 420 }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={(m) => {
            if (m && m !== mapInstance) setMapInstance(m);
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler points={points} setPoints={setPoints} />
          {points.length >= 3 && <Polygon positions={points} pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.2 }} />}
          {points.map((p, i) => (
            <Marker key={i} position={p as LatLngExpression}>
              <Popup>Point {i + 1}</Popup>
            </Marker>
          ))}

          {geojson && (
            <GeoJSON
              key={`gj-${geojson?.features?.length ?? 0}-${tempRange?.min ?? 'x'}-${tempRange?.max ?? 'y'}`}
              data={geojson}
              style={(feature) => {
                const temp =
                  feature?.properties?.average_temperature ??
                  feature?.properties?.max_temperature ??
                  feature?.properties?.temperature ??
                  feature?.properties?.value;
                const n = typeof temp === 'string' ? parseFloat(temp) : temp;
                const color = heatScaleColor(n, tempRange);
                return { color, weight: 1, fillColor: color, fillOpacity: 0.62 };
              }}
              onEachFeature={(feature, layer) => {
                const temp =
                  feature?.properties?.average_temperature ??
                  feature?.properties?.max_temperature ??
                  feature?.properties?.temperature;
                const n = typeof temp === 'string' ? parseFloat(temp) : temp;
                const risk = classifyRisk(n);
                if (temp != null) {
                  layer.bindPopup(
                    `<div><strong>Temperature:</strong> ${Number(temp).toFixed(1)}°C<br/><strong>Risk:</strong> ${risk.label}</div>`
                  );
                }
              }}
            />
          )}

          {hotspots &&
            hotspots.length > 0 &&
            hotspots.map((h: any, idx: number) => {
              const lat = h.latitude ?? h.lat ?? (h.coordinates ? h.coordinates[1] : null);
              const lon = h.longitude ?? h.lon ?? (h.coordinates ? h.coordinates[0] : null);
              const temp = h.temperature ?? h.temp ?? h.value ?? null;
              if (lat == null || lon == null) return null;
              const isKey = h.kind === 'minimum' || h.kind === 'average' || h.kind === 'maximum';
              if (geojson && !isKey) return null;
              const color = colorForPoint(h, tempRange);
              const risk = classifyRisk(typeof temp === 'string' ? parseFloat(temp) : temp);
              return (
                <CircleMarker
                  key={`hot-${idx}-${h.kind ?? 'pt'}`}
                  center={[lat, lon]}
                  radius={isKey ? 12 : 8}
                  pathOptions={{
                    color: '#0f172a',
                    weight: isKey ? 3 : 1,
                    fillColor: color,
                    fillOpacity: 0.95,
                  }}
                >
                  <Popup>
                    <div>
                      {isKey && (
                        <div>
                          <strong>
                            {h.kind === 'maximum' ? 'Hottest' : h.kind === 'minimum' ? 'Coolest' : 'Average'}
                          </strong>
                        </div>
                      )}
                      <div>
                        <strong>Temperature:</strong> {temp ?? 'N/A'}°C
                      </div>
                      <div>
                        <strong>Risk:</strong> {risk.label}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {highlight && (
            <CircleMarker
              center={[highlight.latitude, highlight.longitude]}
              radius={15}
              pathOptions={{ color: '#0f172a', fillColor: highlight.color || '#fff', weight: 3, fillOpacity: 0.95 }}
            >
              <Popup>
                <div>
                  <div>
                    <strong>Temperature:</strong> {highlight.temperature ?? 'N/A'}°C
                  </div>
                  <div>
                    <strong>Risk:</strong> {highlight.riskLabel}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )}

          <Legend range={tempRange} />
        </MapContainer>
      </div>
      {!geojson && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button type="button" className="hs-btn hs-btn-primary" onClick={handleFinish}>
            Finish Polygon
          </button>
          <button type="button" className="hs-btn hs-btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}
      {localError && <div className="hs-error" style={{ marginTop: 8 }}>{localError}</div>}
    </div>
  );
}
