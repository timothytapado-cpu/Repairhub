import Link from "next/link";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { reviewShop } from "@/app/actions";
import { Badge, PageHead } from "@/components/ui";
import { fmtDate, PLAN } from "@/lib/util";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
];

export default async function Approvals({ searchParams }: { searchParams: Promise<{ tab?: string; s?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "pending";
  const sb = await supabaseServer();
  const [{ data: shops }, { data: counts }] = await Promise.all([
    sb.from("shops").select("*, owner:profiles!shops_owner_id_fkey(full_name,phone), shop_services(name)").eq("status", tab).order("created_at", { ascending: false }),
    sb.from("shops").select("status"),
  ]);
  const n = (k: string) => counts?.filter((c) => c.status === k).length ?? 0;
  const sel: any = shops?.find((s) => s.id === sp.s) ?? shops?.[0] ?? null;

  // permit files live in a private bucket: sign a short-lived link for the admin
  let permitUrl: string | null = null;
  if (sel?.permit_url) {
    try {
      const { data } = await supabaseAdmin().storage.from("permits").createSignedUrl(sel.permit_url, 600);
      permitUrl = data?.signedUrl ?? null;
    } catch {
      permitUrl = null;
    }
  }

  return (
    <>
      <PageHead title="Shop approvals" sub="A shop cannot appear in search or take bookings until you approve it." />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`?tab=${k}`} className={tab === k ? "chip-on" : "chip"}>
            {label} ({n(k)})
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {shops?.map((s: any) => (
            <Link key={s.id} href={`?tab=${tab}&s=${s.id}`} className={`block rounded-2xl border bg-white p-4 ${sel?.id === s.id ? "border-2 border-brand" : "border-line"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold">{s.name}</p>
                <Badge tone={s.status}>{s.status === "pending" ? "Pending" : s.status === "approved" ? "Approved" : "Rejected"}</Badge>
              </div>
              <p className="muted mt-1">
                {s.owner?.full_name} · {PLAN[s.plan as "basic" | "pro"].name} plan
              </p>
              <p className="muted">Submitted {fmtDate(s.created_at)}</p>
            </Link>
          ))}
          {!shops?.length && <div className="card muted">Nothing in {tab}.</div>}
        </div>

        {sel && (
          <section className="card !p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">{sel.name}</h2>
                <p className="muted mt-1">Submitted {fmtDate(sel.created_at)}</p>
              </div>
              <Badge tone={sel.status}>{sel.status === "pending" ? "Pending review" : sel.status === "approved" ? "Approved" : "Rejected"}</Badge>
            </div>

            <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-3 text-sm">
              {[
                ["Owner", `${sel.owner?.full_name ?? ""}${sel.owner?.phone ? " · " + sel.owner.phone : ""}`],
                ["Address", `${sel.address}${sel.barangay ? ", " + sel.barangay : ""}`],
                ["Plan chosen", PLAN[sel.plan as "basic" | "pro"].name],
                ["Services", sel.shop_services?.map((x: any) => x.name).join(", ") || "None listed"],
                ["Hours", sel.hours],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-6 font-extrabold">Verification documents</h3>
            <div className="mt-2 flex items-center justify-between border-t border-line py-3 text-sm">
              <span className="flex items-center gap-3 font-bold">
                <span className={`grid h-5 w-5 place-items-center rounded text-[11px] text-white ${sel.permit_url ? "bg-brand" : "border-[1.5px] border-line-strong"}`}>{sel.permit_url ? "✓" : ""}</span>
                Business permit or DTI registration
              </span>
              {permitUrl ? (
                <a href={permitUrl} target="_blank" rel="noreferrer" className="font-bold text-brand-600">
                  View file
                </a>
              ) : (
                <span className="font-bold text-bad-text">{sel.permit_url ? "Link unavailable" : "Not uploaded"}</span>
              )}
            </div>

            {sel.status === "pending" ? (
              <form action={reviewShop} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="id" value={sel.id} />
                <label className="label">Message to the owner (required to reject)</label>
                <input className="input" name="note" placeholder="e.g. The business permit photo is blurry. Please upload a clearer copy." />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button name="decision" value="approve" className="btn-primary">
                    Approve shop
                  </button>
                  <button name="decision" value="reject" className="btn-danger">
                    Reject
                  </button>
                </div>
                <p className="muted mt-3">Approve sets the shop to Verified and makes it visible to customers. Reject sends your message to the owner.</p>
              </form>
            ) : (
              sel.rejection_note && <p className="muted mt-4 border-t border-line pt-4">Message sent to the owner: {sel.rejection_note}</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
