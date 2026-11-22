import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Flash, PageHead, Stat } from "@/components/ui";
import { PLAN, PLAN_LIMITS, fmtDate } from "@/lib/util";

export const dynamic = "force-dynamic";

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? Math.min(100, used * 5) : Math.min(100, (used / limit) * 100);
  const full = !unlimited && used >= limit;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className={`font-bold ${full ? "text-bad-text" : ""}`}>{unlimited ? `${used} (unlimited)` : `${used} of ${limit}`}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-[#e9ecf8]">
        <div className={`h-2 rounded-full ${full ? "bg-[#b4231a]" : "bg-brand"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function OwnerDashboard({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("*").eq("id", p!.shop_id).maybeSingle();
  const [{ data: tickets }, { data: products }, { data: team }] = await Promise.all([
    sb.from("tickets").select("id,code,device,issue,status,customer_name,created_at,updated_at,technician_id").eq("shop_id", p!.shop_id).order("created_at", { ascending: false }),
    sb.from("products").select("*").eq("shop_id", p!.shop_id),
    sb.from("profiles").select("id,full_name,active").eq("shop_id", p!.shop_id).eq("role", "technician"),
  ]);
  const plan = (shop?.plan ?? "basic") as "basic" | "pro";
  const lim = PLAN_LIMITS[plan];
  const all = tickets ?? [];
  const by = (s: string) => all.filter((t) => t.status === s).length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const doneMonth = all.filter((t) => t.status === "done" && new Date(t.updated_at) >= monthStart).length;
  const ticketsMonth = all.filter((t) => new Date(t.created_at) >= monthStart).length;

  // Repairs completed, last 7 days (this week's bars, newest on the right)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toDateString();
    return { label: i === 6 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }), n: all.filter((t) => t.status === "done" && new Date(t.updated_at).toDateString() === key).length, today: i === 6 };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  const week = days.reduce((a, d) => a + d.n, 0);

  const waiting = all.filter((t) => t.status === "new");
  const low = (products ?? []).filter((x) => x.qty <= x.low_threshold);
  const workload = (team ?? []).map((m) => ({ ...m, open: all.filter((t) => t.technician_id === m.id && !["done", "cancelled"].includes(t.status)).length }));
  const techFull = team ? team.length >= lim.technicians : false;

  return (
    <>
      <Flash msg={sp.msg} />
      <PageHead
        title={
          <span className="flex flex-wrap items-center gap-3">
            {shop?.name ?? "Your shop"}
            {shop && <Badge tone={shop.status}>{shop.status === "approved" ? "Verified by admin" : shop.status === "pending" ? "Pending approval" : "Rejected"}</Badge>}
          </span>
        }
        sub={`${PLAN[plan].name} plan`}
        action={
          <Link href="/owner/tickets" className="btn-primary">
            Open ticket board
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New requests" value={by("new")} hint="Waiting for a technician to take" />
        <Stat label="Open tickets" value={by("received") + by("in_progress")} hint="Received or In progress" />
        <Stat label="Ready for pickup" value={by("ready")} hint="Customers notified" />
        <Stat label="Done this month" value={doneMonth} hint="Counted against plan limit" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="card !p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="h-card">Repairs completed, last 7 days</h2>
            <span className="muted">{week} repair{week === 1 ? "" : "s"} this week</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-sm font-extrabold">{d.n}</span>
                <div className={`w-full rounded-lg ${d.today ? "bg-[#9fb4ff]" : "bg-brand"}`} style={{ height: `${Math.max(6, (d.n / maxDay) * 130)}px` }} />
                <span className="text-sm text-ink-soft">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Waiting for a technician ({waiting.length})</h3>
              <Link href="/owner/tickets" className="text-sm font-bold text-brand-600">
                View on ticket board
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line text-sm">
              {waiting.slice(0, 4).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <strong>
                    {t.device} · {t.issue}
                  </strong>
                  <span className="text-ink-soft">
                    {t.customer_name || "Walk-in"} · {fmtDate(t.created_at)}
                  </span>
                </li>
              ))}
              {!waiting.length && <li className="muted py-3">No requests waiting. Nice work.</li>}
            </ul>
            <p className="muted mt-2">Your technicians take these repairs themselves. You can see every ticket but do not need to assign it.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card !p-6">
            <h2 className="h-card mb-4">Plan usage · {PLAN[plan].name}</h2>
            <Usage label="Technicians" used={team?.length ?? 0} limit={lim.technicians} />
            <Usage label="Inventory items" used={products?.length ?? 0} limit={lim.items} />
            <Usage label="Tickets this month" used={ticketsMonth} limit={lim.tickets} />
            {techFull && <p className="mt-2 text-sm font-semibold text-bad-text">Technician limit reached. Upgrade to Pro to add more.</p>}
            {plan === "basic" && (
              <Link href="/owner/subscription" className="btn-tint mt-4 w-full">
                Upgrade to Pro
              </Link>
            )}
          </div>
          <div className="card !p-6">
            <h2 className="h-card">Low stock</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {low.slice(0, 4).map((x) => (
                <li key={x.id} className="flex justify-between py-3">
                  <strong>{x.name}</strong>
                  <span className="font-bold text-bad-text">{x.qty} left</span>
                </li>
              ))}
              {!low.length && <li className="muted py-3">All stock levels are healthy.</li>}
            </ul>
            <Link href="/owner/inventory" className="mt-2 inline-block text-sm font-bold text-brand-600">
              Go to inventory
            </Link>
          </div>
        </div>
      </div>

      <div className="card mt-5 !p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="h-card">Technician workload</h2>
          <Link href="/owner/employees" className={techFull ? "btn-outline !bg-brand-50 !text-ink-soft" : "btn-tint"}>
            {techFull ? "Add technician (limit reached)" : "Add technician"}
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {workload.map((w) => (
            <li key={w.id} className="flex items-center justify-between py-3 text-sm">
              <strong>{w.full_name}</strong>
              <span className="flex items-center gap-3 text-ink-soft">
                {w.open} open ticket{w.open === 1 ? "" : "s"} of 10<span className={`badge ${w.active ? "bg-ok-bg text-ok-text" : "bg-bad-bg text-bad-text"}`}>{w.active ? "Active" : "Deactivated"}</span>
              </span>
            </li>
          ))}
          {!workload.length && <li className="muted py-3">No technicians yet.</li>}
        </ul>
      </div>
    </>
  );
}
