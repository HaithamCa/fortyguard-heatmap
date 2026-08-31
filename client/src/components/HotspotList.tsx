import { classifyRisk, colorForPoint, type TempRange } from '../utils/risk';
import { getLatLon, openInGoogleMaps } from '../utils/maps';

type Props = {
  hotspots?: Array<any>;
  keyTemperatures?: {
    minimum?: any;
    average?: any;
    maximum?: any;
  };
  tempRange?: TempRange | null;
  onSelect?: (h: any) => void;
};

function Row({
  h,
  onSelect,
  badge,
  tempRange,
}: {
  h: any;
  onSelect?: (h: any) => void;
  badge?: string;
  tempRange?: TempRange | null;
}) {
  const temp = h.temperature ?? h.temp ?? h.value ?? null;
  const n = typeof temp === 'string' ? parseFloat(temp) : temp;
  const risk = classifyRisk(n);
  const coords = getLatLon(h);
  const color = colorForPoint({ ...h, temperature: n }, tempRange);
  const kindClass =
    h.kind === 'minimum' ? 'hs-temp-row--minimum' : h.kind === 'maximum' ? 'hs-temp-row--maximum' : h.kind === 'average' ? 'hs-temp-row--average' : '';
  const label =
    h.label ??
    h.name ??
    (coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Location');

  return (
    <li className={`hs-temp-row ${kindClass}`} style={{ ['--row-color' as string]: color }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          cursor: onSelect ? 'pointer' : 'default',
        }}
        onClick={() => onSelect?.(h)}
      >
        <div>
          <div className="hs-badge" style={{ ['--row-color' as string]: color }}>
            <span className="hs-swatch" style={{ ['--row-color' as string]: color }} />
            {badge ?? risk.label}
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {h.kind === 'minimum' ? 'Coolest area' : h.kind === 'maximum' ? 'Hottest area' : h.kind === 'average' ? 'Near average' : risk.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color }}>{n != null && !Number.isNaN(n) ? `${n}°C` : '—'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{risk.label}</div>
        </div>
      </div>
      {coords && (
        <button
          type="button"
          className="hs-btn hs-btn-ghost"
          style={{ marginTop: 8, padding: '6px 10px', fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            openInGoogleMaps(coords.lat, coords.lon, label);
          }}
        >
          Open in Google Maps
        </button>
      )}
    </li>
  );
}

export default function HotspotList({ hotspots, keyTemperatures, tempRange, onSelect }: Props) {
  const keys = [
    keyTemperatures?.maximum && { badge: 'Hottest', h: { ...keyTemperatures.maximum, kind: 'maximum' } },
    keyTemperatures?.average && { badge: 'Average', h: { ...keyTemperatures.average, kind: 'average' } },
    keyTemperatures?.minimum && { badge: 'Coolest', h: { ...keyTemperatures.minimum, kind: 'minimum' } },
  ].filter(Boolean) as Array<{ badge: string; h: any }>;

  const extras = (hotspots ?? [])
    .map((h: any) => {
      const temp = h.temperature ?? h.temp ?? h.value ?? null;
      const lat = h.latitude ?? h.lat ?? (h.coordinates ? h.coordinates[1] : null);
      const lon = h.longitude ?? h.lon ?? (h.coordinates ? h.coordinates[0] : null);
      return { ...h, temp: typeof temp === 'string' ? parseFloat(temp) : temp, latitude: lat, longitude: lon };
    })
    .filter((h: any) => h.latitude != null && h.longitude != null && (h.temp == null || typeof h.temp === 'number'))
    .filter((h: any) => !h.kind || (h.kind !== 'minimum' && h.kind !== 'average' && h.kind !== 'maximum'))
    .sort((a: any, b: any) => (b.temp ?? -Infinity) - (a.temp ?? -Infinity))
    .slice(0, 6);

  if (keys.length === 0 && extras.length === 0) {
    return (
      <div className="hs-card">
        <h4 style={{ marginTop: 0 }}>Temperature locations</h4>
        <div className="hs-muted">No locations yet</div>
      </div>
    );
  }

  return (
    <div className="hs-card">
      <h4 style={{ marginTop: 0, marginBottom: 6 }}>Temperature locations</h4>
      <div className="hs-legend-bar" />
      <div className="hs-scale-hint">
        <span>Cooler</span>
        <span>Hotter</span>
      </div>

      {keys.length > 0 && (
        <ol style={{ padding: 0, margin: '12px 0 0' }}>
          {keys.map((item) => (
            <Row key={item.badge} h={item.h} badge={item.badge} onSelect={onSelect} tempRange={tempRange} />
          ))}
        </ol>
      )}

      {extras.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: '#64748b', margin: '12px 0 8px', fontWeight: 600 }}>Other tiles</div>
          <ol style={{ padding: 0, margin: 0 }}>
            {extras.map((h: any, i: number) => (
              <Row key={i} h={h} onSelect={onSelect} tempRange={tempRange} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
