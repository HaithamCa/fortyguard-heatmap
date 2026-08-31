import React from 'react';
import { KEY_TEMP_COLORS } from '../utils/risk';

export default function MetricsPanel({ summary, dateTime, areaName }: { summary?: any; dateTime?: any; areaName?: string }) {
  const min = summary?.minimum ?? '—';
  const avg = summary?.average ?? '—';
  const max = summary?.maximum ?? '—';
  const dateText = dateTime ? `${dateTime.start_date ?? dateTime.date ?? ''} ${dateTime.start_time ?? ''}`.trim() : '—';

  return (
    <div className="hs-card">
      <h4 style={{ margin: '0 0 10px' }}>{areaName ?? 'Selected area'}</h4>
      <div className="hs-metric-grid">
        <div className="hs-metric hs-metric--min">
          <div className="hs-metric-label">Min (cooler)</div>
          <div className="hs-metric-value" style={{ color: KEY_TEMP_COLORS.minimum }}>{min}°C</div>
        </div>
        <div className="hs-metric hs-metric--avg">
          <div className="hs-metric-label">Average</div>
          <div className="hs-metric-value" style={{ color: KEY_TEMP_COLORS.average }}>{avg}°C</div>
        </div>
        <div className="hs-metric hs-metric--max">
          <div className="hs-metric-label">Max (hotter)</div>
          <div className="hs-metric-value" style={{ color: KEY_TEMP_COLORS.maximum }}>{max}°C</div>
        </div>
        <div className="hs-metric">
          <div className="hs-metric-label">Date / time</div>
          <div style={{ fontWeight: 600, marginTop: 6, fontSize: 14 }}>{dateText}</div>
        </div>
      </div>
    </div>
  );
}
