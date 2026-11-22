"use client";
import dynamic from "next/dynamic";

export type MapShop = { id: string; name: string; lat: number; lng: number; distance?: number | null; n?: number };
export type MapMe = { lat: number; lng: number; label?: string };

const Inner = dynamic(() => import("./shop-map-inner"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-64 place-items-center rounded-2xl bg-white text-sm text-ink-soft">Loading map…</div>,
});

export type ShopMapProps = {
  shops: MapShop[];
  me?: MapMe | null;
  height?: number;
  selectedId?: string | null;
  route?: [number, number][] | null;
  onSelect?: (id: string) => void;
};

export function ShopMap(props: ShopMapProps) {
  return (
    <div style={{ height: props.height ?? 360 }} className="overflow-hidden rounded-2xl border border-line bg-[#e1e6f1]">
      <Inner {...props} />
    </div>
  );
}

export const LocationPicker = dynamic(() => import("./location-picker-inner"), {
  ssr: false,
  loading: () => <div className="grid h-64 place-items-center rounded-xl border border-line bg-white text-sm text-ink-soft">Loading map…</div>,
});
