import { SubmitButton } from "@/components/submit-button";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { submitPermit } from "@/app/actions";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const p = await requireRole("owner");
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("name,status,plan,rejection_note,permit_url").eq("id", p.shop_id).maybeSingle();
  const [{ count: fresh }, { data: low }] = await Promise.all([
    sb.from("tickets").select("id", { count: "exact", head: true }).eq("shop_id", p.shop_id).eq("status", "new"),
    sb.from("products").select("qty,low_threshold").eq("shop_id", p.shop_id),
  ]);
  const lowCount = low?.filter((x) => x.qty <= x.low_threshold).length ?? 0;
  return (
    <Shell
      workspace={`Shop owner workspace${shop ? " · " + shop.name : ""}`}
      nav={[
        { href: "/owner/dashboard", label: "Dashboard" },
        { href: "/owner/tickets", label: "Ticket board", badge: fresh ? `${fresh} new` : null },
        { href: "/owner/inventory", label: "Inventory", badge: lowCount ? `${lowCount} low` : null },
        { href: "/owner/employees", label: "Employees" },
        { href: "/owner/profile", label: "Shop profile" },
        { href: "/owner/subscription", label: "Subscription" },
        { href: "/owner/report", label: "Report a problem" },
      ]}
    >
      {shop?.status === "pending" && !shop.permit_url && (
        <div className="mb-5 rounded-2xl bg-warn-bg p-4 text-warn-text">
          <p className="text-sm font-extrabold">Your shop is live, but not verified yet.</p>
          <p className="mt-1 text-sm">Customers can already find you and send requests. Submit your business permit or DTI registration to earn the Verified badge.</p>
          <form action={submitPermit} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="permit" required accept="image/*,application/pdf" className="min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-ink" />
            <SubmitButton className="btn-primary !py-2">Submit for verification</SubmitButton>
          </form>
        </div>
      )}
      {shop?.status === "pending" && shop.permit_url && (
        <div className="mb-5 rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-600">Permit submitted. An admin is reviewing it. Your shop stays live while you wait, and the Verified badge appears once it is approved.</div>
      )}
      {shop?.status === "rejected" && (
        <div className="mb-5 rounded-2xl bg-bad-bg p-4 text-bad-text">
          <p className="text-sm font-extrabold">Your verification was declined. Your shop is still live, just without the Verified badge.</p>
          {shop.rejection_note && <p className="mt-1 text-sm">Reason from the admin: {shop.rejection_note}</p>}
          <form action={submitPermit} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="permit" required accept="image/*,application/pdf" className="min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-ink" />
            <SubmitButton className="btn-primary !py-2">Resubmit a corrected permit</SubmitButton>
          </form>
        </div>
      )}
      {children}
    </Shell>
  );
}
