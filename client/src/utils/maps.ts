/** Open a lat/lng location in Google Maps (new tab / Maps app). */
export function openInGoogleMaps(lat: number, lng: number, _label?: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getLatLon(point: any): { lat: number; lon: number } | null {
  if (!point) return null;
  const lat = point.latitude ?? point.lat ?? (point.coordinates ? point.coordinates[1] : null);
  const lon = point.longitude ?? point.lon ?? (point.coordinates ? point.coordinates[0] : null);
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  return { lat, lon };
}
