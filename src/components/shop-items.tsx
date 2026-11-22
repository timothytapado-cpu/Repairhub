"use client";
import { useMemo, useState } from "react";
import { peso } from "@/lib/util";

export type ShopItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  price: number;
  qty: number;
};

/** "Items sold here": product cards with photos and category filter chips. */
export function ShopItems({ items }: { items: ShopItem[] }) {
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.category, (counts.get(i.category) ?? 0) + 1));
    return [...counts.entries()];
  }, [items]);
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Also sold here</h2>
        <span className="muted">{items.length} item{items.length > 1 ? "s" : ""}</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["All", items.length] as [string, number], ...cats].map(([c, n]) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${cat === c ? "border-brand bg-brand text-white" : "border-line bg-white hover:bg-canvas"}`}
          >
            {c} <span className={cat === c ? "text-white/80" : "text-ink-soft"}>({n})</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="grid aspect-square place-items-center bg-canvas text-xs text-ink-soft">
              {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : "No photo"}
            </div>
            <div className="p-3 text-sm">
              <div className="muted text-xs">{p.category}</div>
              <div className="font-semibold leading-snug">{p.name}</div>
              {p.description && <p className="muted mt-0.5 line-clamp-2 text-xs">{p.description}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold">{peso(p.price)}</span>
                {p.qty <= 0 ? <span className="badge bg-red-50 text-red-700">Out of stock</span> : p.qty <= 3 ? <span className="badge bg-amber-50 text-amber-700">Only {p.qty} left</span> : <span className="badge bg-green-50 text-green-700">In stock</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
