import React from 'react';
import Header from '../components/Header';
import AnalysisForm from '../components/AnalysisForm';
import HeatmapMap from '../components/HeatmapMap';
import StatusIndicator from '../components/StatusIndicator';
import TemperatureChart from '../components/TemperatureChart';
import HotspotList from '../components/HotspotList';
import MetricsPanel from '../components/MetricsPanel';
import Recommendations from '../components/Recommendations';
import { classifyRisk, type TempRange } from '../utils/risk';
import useHeatmap from '../hooks/useHeatmap';

export default function Dashboard() {
  const { phase, activityId, result, run, errorMessage, reset } = useHeatmap();
  const [lastSubmission, setLastSubmission] = React.useState<any | null>(null);

  const recommendedRiskLevel = React.useMemo(() => {
    if (!result) return null;
    let maxTemp: number | null = null;
    if (Array.isArray(result.hotspots) && result.hotspots.length > 0) {
      for (const h of result.hotspots) {
        const t = h.temperature ?? h.temp ?? h.value ?? null;
        const n = typeof t === 'string' ? parseFloat(t) : t;
        if (typeof n === 'number' && !Number.isNaN(n)) {
          maxTemp = maxTemp == null ? n : Math.max(maxTemp, n);
        }
      }
    }
    if (maxTemp == null && result.summary && typeof result.summary.maximum === 'number') {
      maxTemp = result.summary.maximum;
    }
    if (maxTemp == null) return null;
    return classifyRisk(maxTemp).label;
  }, [result]);

  const tempRange: TempRange | null = React.useMemo(() => {
    const min = result?.summary?.minimum;
    const max = result?.summary?.maximum;
    if (typeof min === 'number' && typeof max === 'number' && max > min) {
      return { min, max };
    }
    return null;
  }, [result]);

  const handleSubmit = async (payload: any) => {
    try {
      const polygon = payload.polygon ?? payload.polygon_aoi;
      const date = payload.date ?? payload.date_time?.start_date;
      const time = payload.time ?? payload.date_time?.start_time;
      const granularity = payload.granularity ?? 100;

      let polygon_aoi = polygon;
      if (polygon && polygon.type === 'Polygon') {
        polygon_aoi = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: polygon }],
        };
      } else if (polygon && polygon.type === 'Feature') {
        polygon_aoi = { type: 'FeatureCollection', features: [polygon] };
      }

      const mapped = {
        polygon_aoi,
        date_time: { start_date: date, start_time: time, filter_type: 1 },
        granularity: Number(granularity),
        area_name: payload.area_name,
      };

      setLastSubmission(mapped);
      await run(mapped);
    } catch (err) {
      console.error('Dashboard submit error', err);
    }
  };

  return (
    <div>
      <Header />
      <main className="hs-shell">
        <div className="hs-layout">
          <section>
            <AnalysisForm
              onSubmit={handleSubmit}
              isAnalyzing={phase === 'submitting' || phase === 'waiting' || phase === 'processing'}
              phase={phase}
              errorMessage={errorMessage}
            />

            {result && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ margin: 0 }}>Analysis result</h3>
                  <button
                    type="button"
                    className="hs-btn hs-btn-secondary"
                    onClick={() => {
                      try {
                        reset();
                      } catch {
                        // ignore
                      }
                      setLastSubmission(null);
                      window.dispatchEvent(new Event('heatmap.clear'));
                      const el = document.getElementById('analysis-form');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    New analysis
                  </button>
                </div>

                <div className="hs-results-grid">
                  <div className="hs-card" style={{ padding: 10 }}>
                    <HeatmapMap
                      hotspots={result.hotspots ?? result}
                      geojson={result.geojson}
                      tempRange={tempRange}
                    />
                  </div>
                  <aside>
                    <MetricsPanel
                      summary={result.summary}
                      dateTime={lastSubmission?.date_time}
                      areaName={lastSubmission?.area_name}
                    />
                    <Recommendations level={recommendedRiskLevel} keyTemperatures={result?.keyTemperatures} />
                    <div style={{ marginTop: 12 }}>
                      <HotspotList
                        hotspots={result?.hotspots ?? result?.hot_locations ?? []}
                        keyTemperatures={result?.keyTemperatures}
                        tempRange={tempRange}
                        onSelect={(h) => {
                          window.dispatchEvent(new CustomEvent('heatmap.select', { detail: h }));
                        }}
                      />
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </section>

          <aside style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <StatusIndicator phase={phase} errorMessage={errorMessage} />
            <TemperatureChart data={result} />
            <div className="hs-card">
              <div className="hs-muted" style={{ fontSize: 12 }}>Activity</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 4, wordBreak: 'break-all' }}>
                {activityId ?? '—'}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
