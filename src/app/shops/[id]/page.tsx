import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getProfile, homeFor } from "@/lib/auth";
import { requestRepair, submitReview, submitReport } from "@/app/actions";
import { TopBar } from "@/components/shell";
import { Flash, Stars, VerifiedBadge } from "@/components/ui";
import { ShopRoute } from "@/components/shop-route";
import { ShopItems } from "@/components/shop-items";
import { OpenPill } from "@/components/open-pill";
import { fmtDate, initials, peso } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function ShopPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; msg?: string; service?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const me = await getProfile();
  const { data: shop } = await sb.from("shops").select("*, shop_services(*), products(*)").eq("id", id).single();
  if (!shop) notFound();
  const { data: reviews } = await sb.from("reviews").select("*, profiles(full_name)").eq("shop_id", id).order("created_at", { ascending: false });
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  const sale = (shop.products ?? [])
    .filter((p: any) => p.for_sale)
    .sort((a: any, b: any) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const canAct = me?.role === "customer";
  const services: any[] = shop.shop_services ?? [];

  return (
    <>
      <TopBar
        links={me?.role === "customer" ? [{ href: "/customer", label: "Find a shop" }, { href: "/customer/tickets", label: "My repairs" }] : [{ href: "/", label: "Find a shop" }]}
        right={
          me ? (
            <Link href={homeFor(me.role)} className="btn-outline !px-4 !py-2">
              My workspace
            </Link>
          ) : (
            <Link href={`/login?next=/shops/${id}`} className="btn-primary !px-4 !py-2">
              Log in
            </Link>
          )
        }
      />
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-6">
          <Link href={me?.role === "customer" ? "/customer" : "/"} className="text-sm font-semibold text-on-dark hover:text-white">
            Back to map and all shops
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-extrabold">{initials(shop.name)}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">{shop.name}</h1>
                  {shop.status === "approved" && <VerifiedBadge />}
                  {shop.plan === "pro" && <span className="badge bg-brand text-white">Pro</span>}
                  <OpenPill hours={shop.hours} short />
                </div>
                <p className="mt-1 text-sm text-on-dark">
                  {avg != null ? `${avg.toFixed(1)} of 5 (${reviews!.length} review${reviews!.length > 1 ? "s" : ""}) · ` : "No reviews yet · "}
                  {shop.address}
                  {shop.barangay ? `, ${shop.barangay}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-on-dark">{shop.status === "approved" ? "✓ Business permit checked by the platform admin" : "Not verified yet · this shop has not completed admin verification"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="#location" className="btn border-[1.5px] border-white/50 text-white hover:bg-white/10">
                Get directions
              </a>
              {canAct && (
                <a href="#request" className="btn-primary">
                  Book a repair
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Flash msg={sp.msg} error={sp.error} />
          {shop.description && (
            <section className="card !p-6">
              <h2 className="h-card">About</h2>
              <p className="mt-2 text-[15px] leading-relaxed">{shop.description}</p>
            </section>
          )}

          <section className="card !p-6">
            <h2 className="h-card">Repair services</h2>
            <p className="muted mt-1">Starting prices. The shop confirms the final price after checking your phone.</p>
            {services.length ? (
              <ul className="mt-3 divide-y divide-line">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="font-bold">{s.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-bold">from {peso(s.price_from)}</span>
                      {canAct && (
                        <Link href={`?service=${encodeURIComponent(s.name)}#request`} className="btn-tint !px-4 !py-2">
                          Book
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted mt-3">This shop has not listed services yet.</p>
            )}
          </section>

          {sale.length > 0 && <ShopItems items={sale} />}

          <section id="reviews" className="card !p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="h-card">Reviews</h2>
              {avg != null && (
                <p className="text-sm text-ink-soft">
                  <span className="text-3xl font-extrabold text-ink">{avg.toFixed(1)}</span> of 5 · {reviews!.length} review{reviews!.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
            {reviews?.length ? (
              <ul className="mt-3 divide-y divide-line">
                {reviews.map((r: any) => (
                  <li key={r.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{r.profiles?.full_name || "Customer"}</strong>
                      <span className="badge bg-ok-bg text-ok-text">Verified repair</span>
                      <Stars value={r.rating} />
                      <span className="text-ink-soft">{fmtDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-[15px]">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted mt-3">Be the first to review this shop.</p>
            )}
            {canAct && (
              <form action={submitReview} className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <input type="hidden" name="shop_id" value={id} />
                <select name="rating" className="input !w-24" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} ★
                    </option>
                  ))}
                </select>
                <input name="comment" className="input min-w-0 flex-1" placeholder="Share your experience" />
                <SubmitButton className="btn-tint">Write a review</SubmitButton>
              </form>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {shop.lat != null && shop.lng != null && (
            <section id="location" className="card !p-6">
              <h2 className="h-card mb-3">Location</h2>
              <ShopRoute shop={{ id: shop.id, name: shop.name, lat: shop.lat, lng: shop.lng }} />
              <p className="mt-3 text-sm font-bold">
                {shop.address}
                {shop.barangay ? `, ${shop.barangay}` : ""}
              </p>
            </section>
          )}
          <section className="card !p-6">
            <h2 className="h-card">Opening hours</h2>
            <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold">{shop.hours}</p>
          </section>
          <section className="card !p-6">
            <h2 className="h-card">Contact</h2>
            {shop.phone ? <p className="mt-2 text-sm font-semibold">{shop.phone}</p> : <p className="muted mt-2">No phone number listed.</p>}
            {shop.email && (
              <a href={`mailto:${shop.email}`} className="mt-1 block break-all text-sm font-semibold text-brand-600">
                {shop.email}
              </a>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="btn-outline mt-3 w-full">
                Call the shop
              </a>
            )}
          </section>
          <section id="request" className="card !p-6">
            <h2 className="h-card">Request a repair</h2>
            {canAct ? (
              <form action={requestRepair} className="mt-3 space-y-3">
                <input type="hidden" name="shop_id" value={id} />
                <div>
                  <label className="label">Phone model</label>
                  <input className="input" name="device" placeholder="e.g. Samsung Galaxy A54" required />
                </div>
                <div>
                  <label className="label">What needs fixing?</label>
                  <select className="input" name="issue" required defaultValue={sp.service ?? undefined}>
                    {[...services.map((s) => s.name as string), "Other / not sure"].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Details</label>
                  <textarea className="input" name="details" rows={3} placeholder="Describe the problem" />
                </div>
                <SubmitButton className="btn-primary w-full">Send request</SubmitButton>
              </form>
            ) : me ? (
              <p className="muted mt-2">Only customer accounts can send repair requests.</p>
            ) : (
              <div className="mt-2">
                <p className="muted mb-3">Log in or create a customer account to send a request.</p>
                <Link href={`/login?next=/shops/${id}`} className="btn-primary w-full">
                  Log in
                </Link>
                <Link href={`/register?next=/shops/${id}`} className="btn-outline mt-2 w-full">
                  Create account
                </Link>
              </div>
            )}
          </section>
          {canAct && (
            <form action={submitReport} className="card space-y-2 !p-6">
              <input type="hidden" name="shop_id" value={id} />
              <input type="hidden" name="from" value={`/shops/${id}`} />
              <h2 className="h-card">Report a problem</h2>
              <textarea name="body" className="input" rows={2} placeholder="What went wrong?" required />
              <SubmitButton className="btn-danger w-full">Report this shop</SubmitButton>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
