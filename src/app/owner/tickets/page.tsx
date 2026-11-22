import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/util";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

const COLS = [
  { key: "new", title: "New requests", sub: "Waiting for a technician to take it" },
  { key: "received", title: "Received", sub: "Taken, not started yet" },
  { key: "in_progress", title: "In progress", sub: "Technician is working" },
  { key: "ready", title: "Ready", sub: "Waiting for pickup" },
  { key: "done", title: "Done", sub: "Picked up and paid" },
];

export default async function Board() {
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data } = await sb
    .from("tickets")
    .select("id,code,device,issue,status,customer_name,created_at,tech:profiles!tickets_technician_id_fkey(full_name)")
    .eq("shop_id", p!.shop_id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  return (
    <>
      <PageHead title="Ticket board" sub="View every ticket in your shop. Technicians take the repairs and move them; you can open any ticket to see its history or reassign it." />
      <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
        {COLS.map((c) => {
          const items = (data ?? []).filter((t: any) => t.status === c.key);
          return (
            <section key={c.key} className="min-w-40 rounded-2xl bg-[#e7ecf9] p-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{c.title}</h2>
                <span className="rounded-full bg-white px-2 text-xs font-semibold">{items.length}</span>
              </div>
              <p className="muted mb-3 text-xs">{c.sub}</p>
              <div className="space-y-3">
                {items.slice(0, c.key === "done" ? 8 : 50).map((t: any) => (
                  <div key={t.id} className="rounded-xl border border-line bg-white p-3 text-sm">
                    <div className="text-xs font-semibold text-ink-soft">{t.code}</div>
                    <div className="font-semibold">{t.device}</div>
                    <div>{t.issue}</div>
                    <div className="muted text-xs">
                      {t.customer_name || "Walk-in"} · {fmtDate(t.created_at)}
                    </div>
                    {t.tech?.full_name ? <div className="mt-1 text-xs font-semibold">{t.tech.full_name}</div> : <div className="mt-1 text-xs font-semibold text-red-700">No technician yet</div>}
                    <Link href={`/owner/tickets/${t.id}`} className="btn-outline mt-2 w-full !py-1.5">
                      {c.key === "new" ? "View request" : c.key === "done" ? "View history" : "View ticket"}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="muted mt-5 rounded-xl border border-line bg-white p-4">
        Who does what: a technician takes a new request, which creates the ticket under their name. They move it Received → In progress → Ready → Done. As the owner you see everything and can reassign a ticket from inside it if a technician is absent.
      </p>
    </>
  );
}
