"use client";
import { useState } from "react";
import { ShopMap, type MapMe } from "./shop-map";
import { drivingRoute, type Route } from "@/lib/geo";

/** Shop location map with a "Get directions" button that draws the driving route from the customer. */
export function ShopRoute({ shop }: { shop: { id: string; name: string; lat: number; lng: number } }) {
  const [me, setMe] = useState<MapMe | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const go = () => {
    if (!navigator.geolocation) return setMsg("Location is not available in this browser.");
    setBusy(true);
    setMsg("");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const from = { lat: p.coords.latitude, lng: p.coords.longitude };
        try {
          const r = await drivingRoute(from, shop);
          setMe(from);
          setRoute(r);
          if (!r) setMsg("No driving route found from your location.");
        } catch (e: any) {
          setMsg(e.message);
        }
        setBusy(false);
      },
      () => {
        setMsg("Allow location access to get directions.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <ShopMap shops={[shop]} me={me} route={route?.points ?? null} height={route ? 300 : 240} />
      {route && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm">
          <strong>{route.km.toFixed(1)} km</strong> · about <strong>{route.minutes} min</strong> by road from your location
        </p>
      )}
      {msg && <p className="mt-2 text-sm text-red-700">{msg}</p>}
      <button onClick={go} disabled={busy} className="btn-primary mt-3 w-full">
        {busy ? "Finding route…" : route ? "Update route" : "Get directions"}
      </button>
      <a className="mt-2 block text-center text-sm font-semibold text-brand" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${shop.lat}%2C${shop.lng}`}>
        Open in full map
      </a>
    </div>
  );
}
