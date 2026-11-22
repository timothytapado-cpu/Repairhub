"use client";
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { geocode, reverseGeocode, type Place } from "@/lib/geo";

function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
function Fly({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 17);
  }, [pos, map]);
  return null;
}

/** Fill a form field by name, but only if the owner hasn't typed something already. */
function fill(name: string, value?: string) {
  if (!value) return;
  const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (el && !el.value.trim()) {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/** Search an address, click the map, or use your location to set the shop pin. Writes hidden lat/lng inputs. */
export default function LocationPickerInner({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const [pos, setPos] = useState<[number, number] | null>(lat != null && lng != null ? [lat, lng] : null);
  const [fly, setFly] = useState<[number, number] | null>(null);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [found, setFound] = useState("");

  const apply = (p: Place, move: boolean) => {
    setPos([p.lat, p.lng]);
    if (move) setFly([p.lat, p.lng]);
    setFound(p.short);
    const a = p.address;
    fill("address", a.road);
    fill("barangay", [a.suburb ?? a.village, a.town ?? a.city ?? a.municipality].filter(Boolean).join(", "));
  };

  const search = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await geocode(q);
      setResults(r);
      if (!r.length) setMsg("No match found. Try a street, barangay or town name, or click the map.");
    } catch (e: any) {
      setMsg(e.message);
    }
    setBusy(false);
  };

  const pickOnMap = async (a: number, b: number) => {
    setPos([a, b]);
    setResults([]);
    const p = await reverseGeocode(a, b).catch(() => null);
    if (p) apply(p, false);
  };

  const locate = () => {
    if (!navigator.geolocation) return setMsg("Location is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMsg("");
        setResults([]);
        const c: [number, number] = [p.coords.latitude, p.coords.longitude];
        setFly(c);
        pickOnMap(c[0], c[1]);
      },
      () => setMsg("Could not get your location. Search an address or click the map instead."),
    );
  };

  return (
    <div>
      <input type="hidden" name="lat" value={pos ? pos[0] : ""} />
      <input type="hidden" name="lng" value={pos ? pos[1] : ""} />
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Search your shop address (e.g. Rizal St, Siniloan, Laguna)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <button type="button" onClick={search} disabled={busy || q.trim().length < 3} className="btn-primary shrink-0">
          {busy ? "Searching…" : "Search"}
        </button>
        <button type="button" onClick={locate} className="btn-outline shrink-0">
          Use my location
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-canvas"
                onClick={() => {
                  apply(r, true);
                  setResults([]);
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted mt-2">{pos ? `Pin set${found ? ` near ${found}` : ""} (${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}). Click the map to move it.` : "Search an address or click the map to drop your shop pin."}</p>
      <div className="mt-2 h-64 overflow-hidden rounded-xl border border-line">
        <MapContainer center={pos ?? [14.4247, 121.4531]} zoom={pos ? 16 : 13} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Clicker onPick={pickOnMap} />
          <Fly pos={fly} />
          {pos && <CircleMarker center={pos} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f5bff", fillOpacity: 1 }} />}
        </MapContainer>
      </div>
      {msg && <p className="mt-1 text-sm text-red-700">{msg}</p>}
    </div>
  );
}
