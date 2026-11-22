"use client";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, Popup, ZoomControl, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { MapMe, ShopMapProps } from "./shop-map";

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  const key = pts.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [50, 50], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

// Numbered round pin from the Figma: navy circle, white border; the selected one is brand blue and larger.
const pin = (n: number | undefined, selected: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [selected ? 40 : 34, selected ? 40 : 34],
    iconAnchor: [selected ? 20 : 17, selected ? 20 : 17],
    html: `<div style="width:100%;height:100%;border-radius:999px;background:${selected ? "#2f5bff" : "#0e1963"};border:3px solid #fff;box-shadow:0 2px 8px rgba(14,25,99,.35);color:#fff;display:grid;place-items:center;font:800 ${selected ? 15 : 13}px Manrope,system-ui,sans-serif">${n ?? ""}</div>`,
  });

const youIcon = (label: string) =>
  L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div style="transform:translate(-9px,-12px);display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:999px;padding:3px 9px 3px 6px;box-shadow:0 2px 8px rgba(14,25,99,.25);white-space:nowrap;font:700 12px Manrope,system-ui,sans-serif;color:#141a3d"><span style="width:11px;height:11px;border-radius:999px;background:#e4572e"></span>${label}</div>`,
  });

export default function ShopMapInner({ shops, me, selectedId, route, onSelect }: ShopMapProps) {
  const pts: [number, number][] = route && route.length ? route : shops.map((s) => [s.lat, s.lng] as [number, number]);
  if (me && !(route && route.length)) pts.push([me.lat, me.lng]);
  const center: [number, number] = pts[0] ?? [14.4247, 121.4531]; // Siniloan, Laguna
  const youLabel = (m: MapMe) => (m.label && m.label !== "Near you" ? "You" : "You");
  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} zoomControl={false}>
      <ZoomControl position="bottomright" />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit pts={pts} />
      {route && route.length > 1 && (
        <>
          <Polyline positions={route} pathOptions={{ color: "#fff", weight: 9, opacity: 0.9 }} />
          <Polyline positions={route} pathOptions={{ color: "#2f5bff", weight: 5 }} />
        </>
      )}
      {me && <Marker position={[me.lat, me.lng]} icon={youIcon(youLabel(me))} />}
      {shops.map((s) =>
        s.n != null ? (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={pin(s.n, selectedId === s.id)} zIndexOffset={selectedId === s.id ? 1000 : 0} eventHandlers={{ click: () => onSelect?.(s.id) }} />
        ) : (
          <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={selectedId === s.id ? 12 : 9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f5bff", fillOpacity: 1 }}>
            <Popup>
              <strong>{s.name}</strong>
              {s.distance != null && <div>{s.distance.toFixed(1)} km away</div>}
              <a href={`/shops/${s.id}`}>View shop</a>
            </Popup>
          </CircleMarker>
        ),
      )}
    </MapContainer>
  );
}
