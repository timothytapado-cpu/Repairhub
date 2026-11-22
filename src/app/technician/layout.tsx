import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const p = await requireRole("technician");
  const sb = await supabaseServer();
  const [{ count: open }, { data: shop }] = await Promise.all([
    sb.from("tickets").select("id", { count: "exact", head: true }).eq("technician_id", p.id).not("status", "in", "(done,cancelled)"),
    sb.from("shops").select("name").eq("id", p.shop_id).maybeSingle(),
  ]);
  return (
    <Shell workspace={`Technician · ${shop?.name ?? ""}`} nav={[{ href: "/technician", label: "My jobs", badge: open || null }, { href: "/technician/report", label: "Report a problem" }]}>
      {children}
    </Shell>
  );
}
