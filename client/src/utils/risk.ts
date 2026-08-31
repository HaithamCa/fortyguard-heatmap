export type Risk = { label: string; color: string };

/** Absolute risk bands — cooler = blue/teal, hotter = orange/red */
export function classifyRisk(temp: number | null | undefined): Risk {
  if (temp === null || temp === undefined || Number.isNaN(temp)) {
    return { label: 'Unknown', color: '#94a3b8' };
  }
  if (temp < 30) return { label: 'Low', color: '#0284c7' }; // cool blue
  if (temp >= 30 && temp < 35) return { label: 'Moderate', color: '#eab308' }; // warm yellow
  if (temp >= 35 && temp < 40) return { label: 'High', color: '#f97316' }; // hot orange
  return { label: 'Extreme', color: '#dc2626' }; // extreme red
}

export const RISK_BANDS: Array<{ label: string; range: string; color: string; meaning: string }> = [
  { label: 'Low', range: '< 30°C', color: '#0284c7', meaning: 'Cooler' },
  { label: 'Moderate', range: '30–35°C', color: '#eab308', meaning: 'Warm' },
  { label: 'High', range: '35–40°C', color: '#f97316', meaning: 'Hot' },
  { label: 'Extreme', range: '> 40°C', color: '#dc2626', meaning: 'Hottest' },
];

/** Explicit colors for min / avg / max key locations */
export const KEY_TEMP_COLORS = {
  minimum: '#0284c7',
  average: '#ca8a04',
  maximum: '#dc2626',
} as const;

export type TempRange = { min: number; max: number };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

const HEAT_STOPS = ['#0284c7', '#22c55e', '#eab308', '#f97316', '#dc2626'];

/**
 * Continuous cool → hot color for map tiles.
 * Uses the analysis min/max so cooler vs hotter areas always contrast,
 * even when absolute temps sit in the same risk band.
 */
export function heatScaleColor(temp: number | null | undefined, range?: TempRange | null): string {
  if (temp === null || temp === undefined || Number.isNaN(temp)) return '#94a3b8';
  if (!range || !(range.max > range.min)) return classifyRisk(temp).color;

  const t = Math.min(1, Math.max(0, (temp - range.min) / (range.max - range.min)));
  const scaled = t * (HEAT_STOPS.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  if (i >= HEAT_STOPS.length - 1) return HEAT_STOPS[HEAT_STOPS.length - 1];
  const [r1, g1, b1] = hexToRgb(HEAT_STOPS[i]);
  const [r2, g2, b2] = hexToRgb(HEAT_STOPS[i + 1]);
  return rgbToHex(lerp(r1, r2, f), lerp(g1, g2, f), lerp(b1, b2, f));
}

export function colorForPoint(
  point: { kind?: string; temperature?: number; temp?: number },
  range?: TempRange | null
): string {
  if (point?.kind === 'minimum') return KEY_TEMP_COLORS.minimum;
  if (point?.kind === 'maximum') return KEY_TEMP_COLORS.maximum;
  if (point?.kind === 'average') return KEY_TEMP_COLORS.average;
  const temp = point?.temperature ?? point?.temp;
  return heatScaleColor(typeof temp === 'string' ? parseFloat(temp) : temp, range);
}
