import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  const sb = await supabaseServer();
  const [{ count: pending }, { count: reports }] = await Promise.all([
    sb.from("shops").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("reports").select("id", { count: "exact", head: true }).eq("resolved", false),
  ]);
  return (
    <Shell
      admin
      workspace="System admin console"
      nav={[
        { href: "/admin/overview", label: "Overview", badge: reports ? `${reports} reports` : null },
        { href: "/admin/approvals", label: "Shop approvals", badge: pending || null },
      ]}
    >
      {children}
    </Shell>
  );
}
