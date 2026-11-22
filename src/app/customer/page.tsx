import Link from "next/link";
import { CustomerFinder } from "@/components/customer-finder";
import { Badge } from "@/components/ui";
import { loadFinderShops } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STEPS = [
  ["1. Send a request", "Pick a shop, describe the device and the problem, choose a date."],
  ["2. Shop accepts", "A technician takes your request. You are notified either way."],
  ["3. Track the repair", "Received, In progress, Ready, Done. Chat with the shop anytime."],
  ["4. Pick up and rate", "Once the ticket is Done you can rate and review the shop."],
];

export default async function CustomerHome() {
  const me = await getProfile();
  const sb = await supabaseServer();
  const [shops, { data: active }] = await Promise.all([
    loadFinderShops(),
    sb.from("tickets").select("id,code,device,issue,status,shops(name)").eq("customer_id", me!.id).not("status", "in", "(done,cancelled)").order("updated_at", { ascending: false }),
  ]);
  const top: any = active?.[0];
  return (
    <>
      {top && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy p-6 text-white">
          <div>
            <p className="eyebrow text-on-dark">
              Your active repair · Ticket {top.code}
              {active!.length > 1 ? ` · +${active!.length - 1} more` : ""}
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              {top.device} at {top.shops?.name}
            </h2>
            <p className="mt-1 text-on-dark">{top.issue}.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge tone={top.status} />
            <Link href={`/customer/tickets/${top.id}`} className="btn bg-white text-ink hover:bg-canvas">
              Track repair
            </Link>
          </div>
        </div>
      )}
      <h1 className="h-page mb-4">Find a repair shop near you</h1>
      <CustomerFinder shops={shops} />
      <div className="card mt-8 !p-6">
        <h2 className="h-card">How booking works</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map(([t, d]) => (
            <div key={t} className="rounded-xl bg-canvas p-4">
              <h3 className="text-sm font-extrabold">{t}</h3>
              <p className="muted mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
