// Free map services, called from the browser. No API key needed.
//  - Nominatim (OpenStreetMap) for address search and reverse lookup
//  - OSRM public demo server for driving routes
// Nominatim's policy: at most 1 request/second, no search-as-you-type. We only call it on a button press.

export type Place = { lat: number; lng: number; label: string; short: string; address: { road?: string; suburb?: string; village?: string; town?: string; city?: string; municipality?: string; state?: string } };

const NOMINATIM = "https://nominatim.openstreetmap.org";

function shorten(display: string) {
  return display.split(",").slice(0, 3).join(",").trim();
}

/** Search an address or place name, limited to the Philippines. */
export async function geocode(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ph&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Address search is busy. Try again in a moment.");
  const rows: any[] = await res.json();
  return rows.map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), label: r.display_name, short: shorten(r.display_name), address: r.address ?? {} }));
}

/** Turn a map pin into an address. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const r = await res.json();
  if (!r || r.error) return null;
  return { lat, lng, label: r.display_name, short: shorten(r.display_name), address: r.address ?? {} };
}

export type Route = { points: [number, number][]; km: number; minutes: number };

/** Driving route between two points. Returns null if none is found. */
export async function drivingRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<Route | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not get directions right now.");
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r) return null;
  return {
    points: r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
    km: r.distance / 1000,
    minutes: Math.max(1, Math.round(r.duration / 60)),
  };
}
