"use client";
import { useMemo, useState } from "react";
import { geocode } from "@/lib/geo";
import { haversine, openStatus } from "@/lib/util";
import type { MapMe } from "./shop-map";

export type FinderShop = {
  id: string;
  name: string;
  address: string;
  barangay: string;
  lat: number | null;
  lng: number | null;
  plan: string;
  verified: boolean;
  logo: string | null;
  phone: string;
  hours: string;
  rating: number | null;
  reviews: number;
  services: { name: string; price: number }[];
  minPrice: number | null;
  latestReview: { comment: string; rating: number } | null;
};

/** "all", "verified" (admin-verified shops only), "open" (open right now), or a keyword matched against the shop's service names. */
export type Filter = string;

/** Shared search state for the landing page and the customer's "find a shop" page. */
export function useFinder(shops: FinderShop[]) {
  const [q, setQ] = useState("");
  const [me, setMe] = useState<MapMe | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const locate = () => {
    if (!navigator.geolocation) return setNote("Location is not available in this browser.");
    setNote("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude, label: "Near you" });
        setNote("");
      },
      () => setNote("Location permission denied. Type an address instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Address, barangay or landmark -> coordinates (free Nominatim geocoding). Shops then sort by distance.
  const searchArea = async () => {
    const term = q.trim();
    if (term.length < 3) return setNote("Type at least 3 letters of a street, barangay or landmark.");
    setBusy(true);
    setNote("");
    try {
      const r = await geocode(term);
      if (!r.length) setNote("No place found. Try a town or barangay name, for example “Santa Maria, Laguna”.");
      else setMe({ lat: r[0].lat, lng: r[0].lng, label: r[0].short });
    } catch (e: any) {
      setNote(e.message);
    }
    setBusy(false);
  };

  const list = useMemo(() => {
    const rows = shops
      .filter((s) => {
        const names = s.services.map((x) => x.name.toLowerCase()).join(" ");
        if (filter === "all") return true;
        if (filter === "verified") return s.verified;
        if (filter === "open") return !!openStatus(s.hours)?.open;
        return names.includes(filter);
      })
      .map((s) => ({ ...s, distance: me && s.lat != null && s.lng != null ? haversine(me.lat, me.lng, s.lat, s.lng) : (null as number | null) }));
    rows.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9) || +b.verified - +a.verified || (b.plan === "pro" ? 1 : 0) - (a.plan === "pro" ? 1 : 0) || a.name.localeCompare(b.name));
    return rows;
  }, [shops, me, filter]);

  return { q, setQ, me, setMe, note, busy, filter, setFilter, locate, searchArea, list };
}

export type FinderRow = ReturnType<typeof useFinder>["list"][number];
