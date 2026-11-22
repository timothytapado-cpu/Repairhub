import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { changePlan } from "@/app/actions";
import { Flash } from "@/components/ui";
import { PLAN } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function Subscription({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("plan,plan_paid_until").eq("id", p!.shop_id).single();
  const expired = shop?.plan_paid_until && new Date(shop.plan_paid_until) < new Date();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Subscription</h1>
      <p className="muted mb-4">
        Current plan: <strong>{PLAN[(shop?.plan ?? "basic") as "basic" | "pro"].name}</strong>
        {shop?.plan_paid_until && <> · {expired ? "expired on" : "paid until"} {shop.plan_paid_until}</>}
      </p>
      <Flash msg={sp.msg} error={sp.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        {(["basic", "pro"] as const).map((k) => (
          <form key={k} action={changePlan} className={`card ${shop?.plan === k ? "border-brand ring-2 ring-brand/20" : ""}`}>
            <input type="hidden" name="plan" value={k} />
            <h2 className="text-lg font-bold">{PLAN[k].name}</h2>
            <p className="text-3xl font-bold">
              ₱{PLAN[k].price}
              <span className="text-sm font-normal text-ink-soft">/month</span>
            </p>
            <p className="muted my-3">{PLAN[k].blurb}</p>
            <button className={shop?.plan === k ? "btn-outline w-full" : "btn-primary w-full"}>{shop?.plan === k ? "Renew (simulated)" : `Switch to ${PLAN[k].name}`}</button>
          </form>
        ))}
      </div>
      <p className="muted mt-4">Payments are simulated for the capstone demo. In production a gateway such as PayMongo or GCash would confirm payment first.</p>
    </div>
  );
}
