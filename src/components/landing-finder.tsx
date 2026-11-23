"use client";
import Link from "next/link";
import { useState } from "react";
import { ShopMap } from "./shop-map";
import { OpenPill } from "./open-pill";
import { LogoFull, VerifiedBadge } from "./ui";
import { useFinder, type Filter, type FinderShop } from "./use-finder";
import { fmtDistance, peso } from "@/lib/util";

const FILTERS: [Filter, string][] = [
  ["all", "All repairs"],
  ["screen", "Screen"],
  ["battery", "Battery"],
  ["open", "Open now"],
  ["verified", "Verified only"],
];

/** Landing page body (hero search, numbered shop list, numbered map, "closer look" panel), laid out like the Figma. */
export function LandingFinder({ shops }: { shops: FinderShop[] }) {
  const f = useFinder(shops);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sel = f.list.find((s) => s.id === selectedId) ?? f.list[0] ?? null;
  const pins = f.list.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s.lat != null && s.lng != null).map(({ s, n }) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng!, distance: s.distance, n }));

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 md:max-w-3xl">
            <p className="eyebrow text-on-dark">Local phone repair, made simple</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
              Your phone fixed.
              <br />
              Without the guesswork.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-on-dark">See the repair shops closest to you on the map, compare prices and reviews, then book in a few taps.</p>
            <div className="mt-6 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-brand/30"
                placeholder="Enter your street, barangay or landmark"
                value={f.q}
                onChange={(e) => f.setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && f.searchArea()}
              />
              <button onClick={f.searchArea} disabled={f.busy} className="btn-primary shrink-0 !py-3">
                {f.busy ? "Searching…" : "Search this area"}
              </button>
              <button onClick={f.locate} className="btn-tint shrink-0 !py-3">
                Use my location
              </button>
            </div>
            <p className="mt-3 text-sm text-on-dark">{f.note || "We ask for your location only to sort shops by distance. You can also type an address."}</p>
          </div>
          <div className="hidden shrink-0 rounded-3xl bg-white p-6 shadow-xl lg:block">
            <LogoFull className="h-52" />
          </div>
        </div>
      </section>

      <section id="shops" className="mx-auto max-w-[1240px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Repair shops near {f.me?.label && f.me.label !== "Near you" ? f.me.label : "you"}</h2>
            <p className="muted mt-1">
              {f.list.length} shop{f.list.length === 1 ? "" : "s"} · {f.list.filter((s) => s.verified).length} verified {f.me ? "· sorted by nearest" : "· use your location to sort by distance"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([k, label]) => (
              <button key={k} onClick={() => f.setFilter(k)} className={f.filter === k ? "chip-on" : "chip"}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            {f.list.length === 0 && <div className="card muted">No shops match this filter yet.</div>}
            {f.list.map((s, i) => {
              const on = sel?.id === s.id;
              return (
                <div key={s.id} onClick={() => setSelectedId(s.id)} className={`cursor-pointer rounded-2xl border bg-white p-4 ${on ? "border-2 border-brand" : "border-line"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base font-extrabold text-white ${on ? "bg-brand" : "bg-navy"}`}>{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold leading-tight">
                        {s.name}
                        {s.verified && <VerifiedBadge />}
                      </h3>
                      <p className="muted">
                        {s.rating != null ? `${s.rating.toFixed(1)} (${s.reviews} review${s.reviews === 1 ? "" : "s"})` : "No reviews yet"}
                        {s.distance != null ? ` · ${fmtDistance(s.distance)} away` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="muted mt-3">
                    {s.address}
                    {s.barangay ? `, ${s.barangay}` : ""}
                  </p>
                  {s.services.length > 0 && <p className="mt-2 text-sm font-semibold">{s.services.slice(0, 3).map((x) => x.name).join(" · ")}</p>}
                  <div className="mt-2">
                    <OpenPill hours={s.hours} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Link href={`/shops/${s.id}`} className="btn-primary" onClick={(e) => e.stopPropagation()}>
                      View details
                    </Link>
                    <Link href={`/shops/${s.id}#location`} className="btn-outline" onClick={(e) => e.stopPropagation()}>
                      Get directions
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="sticky top-4">
              <div className="relative">
                <ShopMap shops={pins} me={f.me} height={560} selectedId={sel?.id} onSelect={setSelectedId} />
                <span className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full bg-white px-3.5 py-1.5 text-sm font-bold shadow">{f.me?.label ? `Near ${f.me.label === "Near you" ? "your location" : f.me.label}` : "All shops"}</span>
              </div>
              <p className="muted mt-3">Numbers on the map match the list. Tap a pin or a card to see that shop below.</p>
            </div>
          </div>
        </div>

        {sel && (
          <div className="card mt-6 !p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-brand-600">A closer look before you go</p>
                <h3 className="mt-1 text-2xl font-extrabold">{sel.name}</h3>
                <p className="muted">
                  {sel.verified ? "Verified shop" : "Shop"}{sel.rating != null ? ` · ${sel.rating.toFixed(1)} of 5 from ${sel.reviews} review${sel.reviews === 1 ? "" : "s"}` : ""}
                  {sel.distance != null ? ` · ${fmtDistance(sel.distance)} from you` : ""}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href={`/shops/${sel.id}`} className="btn-outline">
                  View full shop profile
                </Link>
                <Link href={`/shops/${sel.id}#request`} className="btn-primary">
                  Book a repair
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-3">
              <div>
                <p className="eyebrow text-ink-soft">Plan your visit</p>
                <p className="mt-2 text-lg font-extrabold">
                  {sel.address}
                  {sel.barangay ? `, ${sel.barangay}` : ""}
                </p>
                {sel.phone && <p className="mt-2 text-sm">{sel.phone}</p>}
                {sel.hours && <p className="mt-2 text-sm">{sel.hours}</p>}
                <Link href={`/shops/${sel.id}#location`} className="mt-2 inline-block text-sm font-bold text-brand-600">
                  Get directions
                </Link>
              </div>
              <div>
                <p className="eyebrow text-ink-soft">Services and starting prices</p>
                <ul className="mt-2 divide-y divide-line text-sm">
                  {sel.services.slice(0, 3).map((x) => (
                    <li key={x.name} className="flex justify-between py-2">
                      <span>{x.name}</span>
                      <span className="font-bold">from {peso(x.price)}</span>
                    </li>
                  ))}
                  {sel.services.length === 0 && <li className="muted py-2">No services listed yet.</li>}
                </ul>
                <p className="muted mt-2">The shop confirms the final price after checking your phone.</p>
              </div>
              <div>
                <p className="eyebrow text-ink-soft">Latest review</p>
                {sel.latestReview ? (
                  <>
                    <p className="mt-2 text-lg font-semibold leading-snug">{sel.latestReview.comment}</p>
                    <Link href={`/shops/${sel.id}#reviews`} className="mt-2 inline-block text-sm font-bold text-brand-600">
                      Read all {sel.reviews} review{sel.reviews === 1 ? "" : "s"}
                    </Link>
                  </>
                ) : (
                  <p className="muted mt-2">No written reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
