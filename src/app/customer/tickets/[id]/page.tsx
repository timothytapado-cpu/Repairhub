import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { cancelTicket, sendMessage, submitReport } from "@/app/actions";
import { Badge, Flash } from "@/components/ui";
import { fmtDate } from "@/lib/util";

export const dynamic = "force-dynamic";

// Customer-facing stages from the Figma "Track Your Repair" screen.
const STAGES = [
  { key: "received", label: "Received" },
  { key: "diagnosed", label: "Diagnosed" },
  { key: "in_progress", label: "In Repair" },
  { key: "ready", label: "Finished" },
];
const ORDER: Record<string, number> = { new: -1, received: 0, in_progress: 2, ready: 3, done: 3, cancelled: -1 };

export default async function Track({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data: t } = await sb.from("tickets").select("*, shops(id,name,phone), tech:profiles!tickets_technician_id_fkey(full_name)").eq("id", id).single();
  if (!t) notFound();
  const { data: events } = await sb.from("ticket_events").select("*, profiles(full_name)").eq("ticket_id", id).order("created_at", { ascending: true });
  const at = ORDER[t.status] ?? -1;
  const closed = t.status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Flash msg={sp.msg} error={sp.error} />
      <div className="card">
        <p className="muted">
          Ticket {t.code} · {t.shops?.name}
        </p>
        <h1 className="text-2xl font-bold">Track your repair</h1>

        {closed ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">This request was cancelled.</p>
        ) : t.status === "new" ? (
          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm">Waiting for a technician at the shop to take your request.</p>
        ) : (
          <ol className="my-6 grid grid-cols-4 gap-2 text-center text-sm">
            {STAGES.map((s, i) => {
              const done = i <= at;
              const current = i === at || (t.status === "done" && i === 3);
              return (
                <li key={s.key}>
                  <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-white" : "border-line text-ink-soft"} ${current ? "ring-4 ring-brand/20" : ""}`}>{done ? "✓" : i + 1}</div>
                  <div className={`mt-1 ${done ? "font-semibold" : "text-ink-soft"}`}>{s.label}</div>
                </li>
              );
            })}
          </ol>
        )}

        <dl className="divide-y divide-line text-sm">
          {[
            ["Status", <Badge key="s" tone={t.status} />],
            ["Device", t.device],
            ["Issue", t.issue],
            ["Technician", t.tech?.full_name ?? "Not yet assigned"],
            ["Requested", fmtDate(t.created_at)],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between py-2.5">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        {t.estimate_note && <p className="muted mt-3">Latest note: {t.estimate_note}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {t.shops?.phone && (
            <a href={`tel:${t.shops.phone}`} className="btn-primary">
              Contact shop
            </a>
          )}
          <Link href={`/shops/${t.shops?.id}`} className="btn-outline">
            View shop detail
          </Link>
          {t.status === "new" && (
            <form action={cancelTicket}>
              <input type="hidden" name="id" value={id} />
              <SubmitButton className="btn-danger">Cancel request</SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Updates & messages</h2>
        <ul className="space-y-2 text-sm">
          {events?.map((e: any) => (
            <li key={e.id} className={e.kind === "message" ? "rounded-xl bg-brand-50 p-2.5" : "text-ink-soft"}>
              <span className="text-xs text-ink-soft">{fmtDate(e.created_at)} · </span>
              {e.kind === "message" ? <strong>{e.profiles?.full_name}: </strong> : null}
              {e.body}
            </li>
          ))}
          {!events?.length && <li className="muted">No updates yet.</li>}
        </ul>
        {!closed && (
          <form action={sendMessage} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="path" value={`/customer/tickets/${id}`} />
            <input className="input" name="body" placeholder="Message the shop" />
            <SubmitButton className="btn-outline">Send</SubmitButton>
          </form>
        )}
      </div>

      <form action={submitReport} className="card flex gap-2">
        <input type="hidden" name="shop_id" value={t.shops?.id} />
        <input type="hidden" name="from" value={`/customer/tickets/${id}`} />
        <input className="input" name="body" placeholder="Report a problem with this repair" required />
        <SubmitButton className="btn-danger shrink-0">Report</SubmitButton>
      </form>
    </div>
  );
}
