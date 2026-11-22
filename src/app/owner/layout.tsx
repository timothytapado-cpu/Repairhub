import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const p = await requireRole("owner");
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("name,status,plan,rejection_note").eq("id", p.shop_id).maybeSingle();
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
      {shop?.status === "pending" && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your shop is waiting for administrator approval. Customers cannot see it yet; you can already set up staff and your profile.
        </div>
      )}
      {shop?.status === "rejected" && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Your shop was not approved. {shop.rejection_note && <>Reason: {shop.rejection_note}</>}
        </div>
      )}
      {children}
    </Shell>
  );
}
