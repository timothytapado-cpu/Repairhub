import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { assignTechnician, sendMessage, setTicketStatus } from "@/app/actions";
import { Badge, Flash } from "@/components/ui";
import { PhotoStep } from "@/components/repair-photos";
import { loadTicketPhotos } from "@/lib/data";
import { fmtDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function OwnerTicket({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: t } = await sb.from("tickets").select("*").eq("id", id).eq("shop_id", p!.shop_id).single();
  if (!t) notFound();
  const [{ data: team }, { data: events }, photos] = await Promise.all([
    sb.from("profiles").select("id,full_name").eq("shop_id", p!.shop_id).eq("role", "technician").eq("active", true),
    sb.from("ticket_events").select("*, profiles(full_name)").eq("ticket_id", id).order("created_at"),
    loadTicketPhotos(sb, [id]),
  ]);
  const pics = photos[id] ?? {};
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/owner/tickets" className="text-sm font-semibold text-brand">
        ← Back to board
      </Link>
      <Flash msg={sp.msg} error={sp.error} />
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="muted">{t.code}</p>
            <h1 className="text-2xl font-bold">
              {t.device} · {t.issue}
            </h1>
            <p className="muted">
              {t.customer_name || "Walk-in customer"}
              {t.customer_phone ? ` · ${t.customer_phone}` : ""}
              {t.source === "walk_in" ? " · Walk-in" : ""} · requested {fmtDate(t.created_at)}
            </p>
          </div>
          <Badge tone={t.status} />
        </div>
        {t.details && <p className="mt-3 rounded-xl bg-canvas p-3 text-sm">{t.details}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <form action={assignTechnician} className="space-y-2">
            <input type="hidden" name="id" value={id} />
            <label className="label">Technician</label>
            <select className="input" name="technician_id" defaultValue={t.technician_id ?? ""}>
              <option value="">Unassigned</option>
              {team?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
            <SubmitButton className="btn-outline w-full">Save assignment</SubmitButton>
          </form>
          <form action={setTicketStatus} className="space-y-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="from" value={`/owner/tickets/${id}`} />
            <label className="label">Status</label>
            <select className="input" name="status" defaultValue={t.status}>
              {["new", "received", "in_progress", "ready", "done", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <input className="input" name="note" placeholder="Optional note for the customer" />
            <SubmitButton className="btn-primary w-full">Update status</SubmitButton>
          </form>
        </div>
      </div>
      <div className="card space-y-4 !p-6">
        <h2 className="h-card">Repair photos</h2>
        <PhotoStep ticketId={id} kind="before" url={pics.before} from={`/owner/tickets/${id}`} />
        <PhotoStep ticketId={id} kind="after" url={pics.after} from={`/owner/tickets/${id}`} />
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">History & messages</h2>
        <ul className="space-y-2 text-sm">
          {events?.map((e: any) => (
            <li key={e.id} className={e.kind === "message" ? "rounded-xl bg-brand-50 p-2.5" : "text-ink-soft"}>
              <span className="text-xs">{fmtDate(e.created_at)} · </span>
              {e.kind === "message" && <strong>{e.profiles?.full_name}: </strong>}
              {e.body}
            </li>
          ))}
          {!events?.length && <li className="muted">No history yet.</li>}
        </ul>
        {t.customer_id ? (
          <form action={sendMessage} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="path" value={`/owner/tickets/${id}`} />
            <input className="input" name="body" placeholder="Message the customer" />
            <SubmitButton className="btn-outline">Send</SubmitButton>
          </form>
        ) : (
          <p className="muted mt-3">Walk-in customer without an account. Contact them on {t.customer_phone || "the number on the ticket"}.</p>
        )}
      </div>
    </div>
  );
}
