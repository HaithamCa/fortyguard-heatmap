import { RECOMMENDATIONS } from '../utils/recommendations';
import { getLatLon, openInGoogleMaps } from '../utils/maps';
import { classifyRisk, KEY_TEMP_COLORS } from '../utils/risk';

type KeyTemps = {
  minimum?: any;
  average?: any;
  maximum?: any;
};

type PlaceRec = {
  title: string;
  reason: string;
  point: any;
  actionLabel: string;
  accent: string;
};

function buildPlaceRecommendations(level: string | null | undefined, keys?: KeyTemps): PlaceRec[] {
  const out: PlaceRec[] = [];
  const cool = keys?.minimum;
  const hot = keys?.maximum;
  const avg = keys?.average;

  if (cool && getLatLon(cool)) {
    const t = cool.temperature ?? cool.temp;
    out.push({
      title: 'Go to the coolest spot nearby',
      reason: `Lowest measured temperature here is ${t}°C (${classifyRisk(t).label} risk). Prefer this area for outdoor activity or a cooling break.`,
      point: cool,
      actionLabel: 'Open coolest place in Google Maps',
      accent: KEY_TEMP_COLORS.minimum,
    });
  }

  if (hot && getLatLon(hot) && (level === 'High' || level === 'Extreme' || level === 'Moderate')) {
    const t = hot.temperature ?? hot.temp;
    out.push({
      title: 'Avoid the hottest hotspot',
      reason: `Peak temperature is ${t}°C (${classifyRisk(t).label} risk). Limit time here during peak heat.`,
      point: hot,
      actionLabel: 'Open hottest place in Google Maps',
      accent: KEY_TEMP_COLORS.maximum,
    });
  }

  if (avg && getLatLon(avg) && !cool) {
    out.push({
      title: 'Check conditions near the area average',
      reason: `Near-average temperature is ${avg.temperature ?? avg.temp}°C.`,
      point: avg,
      actionLabel: 'Open in Google Maps',
      accent: KEY_TEMP_COLORS.average,
    });
  }

  return out;
}

export default function Recommendations({
  level,
  keyTemperatures,
}: {
  level?: string | null;
  keyTemperatures?: KeyTemps;
}) {
  const tips = level && RECOMMENDATIONS[level] ? RECOMMENDATIONS[level] : RECOMMENDATIONS['Low'];
  const placeRecs = buildPlaceRecommendations(level, keyTemperatures);

  return (
    <div className="hs-card" style={{ marginTop: 12 }}>
      <h4 style={{ margin: '0 0 8px' }}>Recommendations</h4>
      <div style={{ fontSize: 13, color: '#475569' }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Overall risk:</strong> {level ?? 'Low'}
        </div>

        {placeRecs.length > 0 && (
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            {placeRecs.map((rec) => {
              const coords = getLatLon(rec.point)!;
              return (
                <div
                  key={rec.title}
                  style={{
                    border: '1px solid var(--hs-line)',
                    borderLeft: `5px solid ${rec.accent}`,
                    borderRadius: 10,
                    padding: 12,
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, color: rec.accent }}>{rec.title}</div>
                  <div style={{ marginBottom: 8 }}>{rec.reason}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                  </div>
                  <button
                    type="button"
                    className="hs-btn hs-btn-maps"
                    onClick={() => openInGoogleMaps(coords.lat, coords.lon, rec.title)}
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>General guidance</div>
        <ul style={{ marginTop: 0, paddingLeft: 18 }}>
          {tips.map((r, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
