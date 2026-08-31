import React from 'react';
import HeatmapMap from './HeatmapMap';

type Props = {
  onSubmit?: (payload: any) => void;
  isAnalyzing?: boolean;
  phase?: string;
  errorMessage?: string | null;
};

export default function AnalysisForm({ onSubmit, isAnalyzing, phase, errorMessage }: Props) {
  const [date, setDate] = React.useState('2024-07-15');
  const [time, setTime] = React.useState('14:00');
  const [granularity, setGranularity] = React.useState(100);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [polygon, setPolygon] = React.useState<any | null>(null);
  const [areaName, setAreaName] = React.useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!polygon) {
      setLocalError('Please draw a valid area.');
      return;
    }
    setLocalError(null);
    onSubmit?.({
      polygon,
      date,
      time,
      granularity: Number(granularity),
      area_name: areaName?.trim() || undefined,
    });
  };

  React.useEffect(() => {
    function handler() {
      setPolygon(null);
      setAreaName('');
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toTimeString().slice(0, 5));
      setGranularity(100);
      setLocalError(null);
    }
    window.addEventListener('heatmap.clear', handler as EventListener);
    return () => window.removeEventListener('heatmap.clear', handler as EventListener);
  }, []);

  return (
    <form id="analysis-form" className="hs-card" onSubmit={handleSubmit}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Draw analysis area</h3>
      <p className="hs-muted" style={{ marginBottom: 12, fontSize: 14 }}>
        Click the map to place at least 3 points, then finish the polygon. Use a small area inside the United States.
      </p>

      <HeatmapMap compact onPolygonComplete={(g) => setPolygon(g)} />

      <div style={{ marginTop: 12 }}>
        <label className="hs-label">
          Area name (optional)
          <input
            className="hs-input"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="e.g. Downtown block"
          />
        </label>
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div className={polygon ? 'hs-ok' : 'hs-muted'}>{polygon ? 'Area selected ✓' : 'No area selected yet'}</div>
        <button
          type="button"
          className="hs-btn hs-btn-secondary"
          onClick={() => {
            window.dispatchEvent(new Event('heatmap.clear'));
            setPolygon(null);
          }}
        >
          Clear area
        </button>
      </div>

      <div className="hs-form-row">
        <label className="hs-label">
          Date
          <input className="hs-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="hs-label">
          Time
          <input className="hs-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="hs-label">
          Granularity (m)
          <select className="hs-input" value={granularity} onChange={(e) => setGranularity(Number(e.target.value))}>
            <option value={60}>60</option>
            <option value={80}>80</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: 14 }}>
        <button type="submit" className="hs-btn hs-btn-primary" disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing…' : 'Analyze area'}
        </button>
      </div>

      {isAnalyzing && <div className="hs-muted" style={{ marginTop: 8 }}>Submitting analysis…</div>}
      {phase === 'waiting' && <div className="hs-muted" style={{ marginTop: 8 }}>Waiting for FortyGuard…</div>}
      {phase === 'processing' && <div className="hs-muted" style={{ marginTop: 8 }}>Processing temperature tiles…</div>}
      {phase === 'completed' && <div className="hs-ok" style={{ marginTop: 8 }}>Analysis complete ✓</div>}
      {(localError || errorMessage) && <div className="hs-error" style={{ marginTop: 8 }}>{localError ?? errorMessage}</div>}
    </form>
  );
}
