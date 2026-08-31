import { KEY_TEMP_COLORS } from '../utils/risk';

export default function TemperatureChart({ data }: { data?: any }) {
  const min = data?.summary?.minimum ?? '--';
  const avg = data?.summary?.average ?? data?.average ?? '--';
  const max = data?.summary?.maximum ?? data?.max ?? '--';

  return (
    <div className="hs-card">
      <h4 style={{ marginTop: 0 }}>Temperature summary</h4>
      <div className="hs-legend-bar" />
      <div className="hs-scale-hint">
        <span>Cooler</span>
        <span>Hotter</span>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="hs-muted">Minimum</span>
          <strong style={{ color: KEY_TEMP_COLORS.minimum }}>{min}°C</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="hs-muted">Average</span>
          <strong style={{ color: KEY_TEMP_COLORS.average }}>{avg}°C</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="hs-muted">Maximum</span>
          <strong style={{ color: KEY_TEMP_COLORS.maximum }}>{max}°C</strong>
        </div>
      </div>
    </div>
  );
}
