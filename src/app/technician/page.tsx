import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMessage, setTicketStatus, takeRequest } from "@/app/actions";
import { Badge, PageHead } from "@/components/ui";
import { fmtDate } from "@/lib/util";

export const dynamic = "force-dynamic";

const NEXT: Record<string, { to: string; label: string; hint: string }> = {
  received: { to: "in_progress", label: "Start repair", hint: "Starting moves the ticket to In progress and tells the customer." },
  in_progress: { to: "ready", label: "Mark as Ready for pickup", hint: "The customer is told the phone is ready. After pickup and payment you mark the ticket Done." },
  ready: { to: "done", label: "Mark picked up and paid", hint: "Closes the ticket as Done." },
};
const STAGES = [
  ["received", "Received"],
  ["in_progress", "In progress"],
  ["ready", "Ready"],
  ["done", "Done"],
];
const ORDER = ["received", "in_progress", "ready", "done"];

export default async function MyJobs({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const [{ data: open }, { data: mine }] = await Promise.all([
    sb.from("tickets").select("*").eq("shop_id", p!.shop_id).eq("status", "new").order("created_at"),
    sb.from("tickets").select("*").eq("technician_id", p!.id).not("status", "in", "(done,cancelled)").order("updated_at", { ascending: false }),
  ]);
  const sel = mine?.find((t) => t.id === sp.t) ?? mine?.[0] ?? null;
  const { data: events } = sel ? await sb.from("ticket_events").select("*, profiles(full_name)").eq("ticket_id", sel.id).order("created_at") : { data: [] as any[] };
  const nx = sel ? NEXT[sel.status] : null;
  const stageIdx = sel ? ORDER.indexOf(sel.status) : -1;

  return (
    <>
      <PageHead title="My jobs" sub={`${p!.full_name} · ${mine?.length ?? 0} open ticket${mine?.length === 1 ? "" : "s"} of 10. Take new repairs below, then work them here.`} />

      <section className="card !p-6">
        <h2 className="h-card">Available repairs</h2>
        <p className="muted mt-1">New requests for the shop. Take one and it becomes your ticket. The shop owner can see who took it.</p>
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {open?.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-extrabold">
                  {t.device} · {t.issue}
                </p>
                <p className="muted">
                  {t.customer_name} · requested {fmtDate(t.created_at)}
                  {t.details ? ` · ${t.details}` : ""}
                </p>
              </div>
              <form action={takeRequest}>
                <input type="hidden" name="id" value={t.id} />
                <button className="btn-primary">Take this repair</button>
              </form>
            </li>
          ))}
          {!open?.length && <li className="muted py-4">No new requests right now.</li>}
        </ul>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {mine?.map((t) => (
            <Link key={t.id} href={`?t=${t.id}`} className={`block rounded-2xl border bg-white p-4 ${sel?.id === t.id ? "border-2 border-brand" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-soft">{t.code}</span>
                <Badge tone={t.status} />
              </div>
              <p className="mt-2 font-extrabold">{t.device}</p>
              <p className="text-sm">{t.issue}</p>
              <p className="muted mt-1">Updated {fmtDate(t.updated_at)}</p>
            </Link>
          ))}
          {!mine?.length && <div className="card muted">Nothing assigned yet.</div>}
        </div>

        {sel && (
          <section className="card !p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-ink-soft">{sel.code}</p>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {sel.device} · {sel.issue}
                </h2>
                <p className="muted mt-1">
                  Customer: {sel.customer_name} · Requested {fmtDate(sel.created_at)}
                </p>
              </div>
              <Badge tone={sel.status} />
            </div>
            <div className="mt-4 rounded-xl bg-canvas p-4 text-sm">
              <p className="font-extrabold">Problem reported by customer</p>
              <p className="mt-1">{sel.details || "No extra details were given."}</p>
            </div>

            <ol className="mt-5 grid grid-cols-4 gap-3">
              {STAGES.map(([k, label], i) => (
                <li key={k}>
                  <div className={`h-1 rounded-full ${i <= stageIdx ? "bg-brand" : "bg-line-strong"}`} />
                  <p className={`mt-2 text-sm font-bold ${i <= stageIdx ? "" : "text-ink-soft"}`}>{label}</p>
                </li>
              ))}
            </ol>

            {nx && (
              <form action={setTicketStatus} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={sel.id} />
                <input type="hidden" name="status" value={nx.to} />
                <label className="label">Note for the customer (optional)</label>
                <input className="input" name="note" placeholder="e.g. Screen replaced and tested. Ready any time before 7 PM." />
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-primary">{nx.label}</button>
                  <p className="muted flex-1">{nx.hint}</p>
                </div>
              </form>
            )}

            <div className="mt-6 border-t border-line pt-4">
              <h3 className="font-extrabold">History and messages</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {events?.map((e: any) => (
                  <li key={e.id} className={e.kind === "message" ? "rounded-xl bg-brand-50 p-3" : "text-ink-soft"}>
                    <span className="text-xs">{fmtDate(e.created_at)} · </span>
                    {e.kind === "message" && <strong>{e.profiles?.full_name}: </strong>}
                    {e.body}
                  </li>
                ))}
                {!events?.length && <li className="muted">No history yet.</li>}
              </ul>
              <form action={sendMessage} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={sel.id} />
                <input type="hidden" name="path" value="/technician" />
                <input className="input" name="body" placeholder="Message the customer" />
                <button className="btn-tint shrink-0">Message customer</button>
              </form>
              <Link href="/technician/report" className="btn-danger mt-3">
                Report a problem
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
