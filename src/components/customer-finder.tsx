"use client";
import Link from "next/link";
import { OpenPill } from "./open-pill";
import { VerifiedBadge } from "./ui";
import { useFinder, type FinderShop } from "./use-finder";
import { fmtDistance, peso } from "@/lib/util";

const FILTERS: [string, string][] = [
  ["all", "All services"],
  ["screen", "Screen"],
  ["battery", "Battery"],
  ["charging", "Charging port"],
  ["water", "Water damage"],
];

/** Customer "Find a repair shop near you": search card, service chips and a 3-column grid of shop cards (Figma). */
export function CustomerFinder({ shops }: { shops: FinderShop[] }) {
  const f = useFinder(shops);
  return (
    <div>
      <div className="card !p-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-xl bg-canvas px-4 py-3 text-sm outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-brand/30"
            placeholder="Street, barangay or landmark"
            value={f.q}
            onChange={(e) => f.setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && f.searchArea()}
          />
          <button onClick={f.searchArea} disabled={f.busy} className="btn-primary shrink-0 !py-3">
            {f.busy ? "Searching…" : "Search"}
          </button>
          <button onClick={f.locate} className="btn-tint shrink-0 !py-3">
            Use my location
          </button>
        </div>
      </div>
      {(f.note || f.me?.label) && (
        <p className="muted mt-2">
          {f.note || `Sorted by distance from ${f.me!.label === "Near you" ? "your location" : f.me!.label}.`}{" "}
          {f.me && (
            <button onClick={() => f.setMe(null)} className="font-bold text-brand-600">
              Clear
            </button>
          )}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => f.setFilter(k)} className={f.filter === k ? "chip-on" : "chip"}>
            {label}
          </button>
        ))}
        <button onClick={() => f.setFilter("open")} className={f.filter === "open" ? "chip-on" : "chip"}>
          Open now
        </button>
        <button onClick={() => f.setFilter("verified")} className={f.filter === "verified" ? "chip-on" : "chip"}>
          Verified only
        </button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {f.list.length === 0 && <div className="card muted md:col-span-3">No shops match this filter yet.</div>}
        {f.list.map((s) => (
          <div key={s.id} className="card flex flex-col !p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-extrabold leading-tight">{s.name}</h3>
              {s.verified && <VerifiedBadge className="shrink-0" />}
            </div>
            <p className="muted mt-3">
              {s.rating != null ? `${s.rating.toFixed(1)} rating (${s.reviews} review${s.reviews === 1 ? "" : "s"})` : "No reviews yet"}
              {s.distance != null ? ` · ${fmtDistance(s.distance)} away` : ""}
            </p>
            <p className="muted mt-2">
              {s.address}
              {s.barangay ? `, ${s.barangay}` : ""}
            </p>
            <div className="mt-3">
              <OpenPill hours={s.hours} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.services.slice(0, 3).map((x) => (
                <span key={x.name} className="rounded-full bg-canvas px-3 py-1 text-xs font-bold">
                  {x.name.split(" ").slice(0, 2).join(" ")}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm font-extrabold">{s.minPrice != null ? `From ${peso(s.minPrice)}` : ""}</span>
              <div className="flex gap-2">
                <Link href={`/shops/${s.id}`} className="btn-outline !px-4">
                  View shop
                </Link>
                <Link href={`/shops/${s.id}#request`} className="btn-primary !px-4">
                  Book repair
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
