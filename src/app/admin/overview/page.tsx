import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveReport, setUserActive } from "@/app/actions";
import { Badge, PageHead, Stat } from "@/components/ui";
import { PLAN } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const sb = await supabaseServer();
  const [{ data: shops }, { data: profiles }, { count: tickets }, { data: reports }, { data: users }] = await Promise.all([
    sb.from("shops").select("status,plan,created_at"),
    sb.from("profiles").select("role"),
    sb.from("tickets").select("id", { count: "exact", head: true }),
    sb.from("reports").select("*, reporter:profiles!reports_reporter_id_fkey(full_name,role), shops(name)").eq("resolved", false).order("created_at", { ascending: false }),
    sb.from("profiles").select("id,full_name,role,active,shop:shops!profiles_shop_fk(name)").neq("role", "admin").order("created_at", { ascending: false }).limit(25),
  ]);
  const verified = shops?.filter((s) => s.status === "approved") ?? [];
  const pending = shops?.filter((s) => s.status === "pending") ?? [];
  const pro = verified.filter((s) => s.plan === "pro").length;
  const oldest = pending.length ? Math.max(0, Math.floor((Date.now() - Math.min(...pending.map((s) => +new Date(s.created_at)))) / 864e5)) : 0;

  return (
    <>
      <PageHead
        title="Platform overview"
        sub="Everything that needs an admin decision, in one place."
        action={
          pending.length > 0 && (
            <Link href="/admin/approvals" className="btn-primary">
              Review {pending.length} unverified shop{pending.length === 1 ? "" : "s"}
            </Link>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Not verified yet" value={pending.length} hint={pending.length ? `Live shops without the badge · oldest ${oldest} day${oldest === 1 ? "" : "s"}` : "All shops verified"} />
        <Stat label="Open problem reports" value={reports?.length ?? 0} hint="Not yet resolved" />
        <Stat label="Verified shops" value={verified.length} hint={`${pro} on Pro, ${verified.length - pro} on Basic`} />
        <Stat label="Registered users" value={profiles?.length ?? 0} hint={`${tickets ?? 0} repair tickets so far`} />
      </div>

      <div className="card mt-5 !p-6">
        <h2 className="h-card">Problem reports</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Reported by", "Problem", "About", "Status", "Action"].map((h) => (
                  <th key={h} className="th !px-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {reports?.map((r: any) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4">
                    <div className="font-extrabold">{r.reporter?.full_name ?? "Unknown"}</div>
                    <div className="muted text-xs capitalize">{r.reporter?.role}</div>
                  </td>
                  <td className="py-3 pr-4">{r.body}</td>
                  <td className="py-3 pr-4 text-ink-soft">{r.shops?.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="bad">Open</Badge>
                  </td>
                  <td className="py-3">
                    <form action={resolveReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton className="btn-outline !px-4 !py-2">Resolve</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {!reports?.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink-soft">
                    No open reports.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="muted mt-2">Resolving a report closes it. Plan prices: Basic ₱{PLAN.basic.price}, Pro ₱{PLAN.pro.price} per month.</p>
      </div>

      <div className="card mt-5 !p-6">
        <h2 className="h-card">User management</h2>
        <ul className="mt-3 divide-y divide-line">
          {users?.map((u: any) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-extrabold">{u.full_name || "(no name)"}</p>
                <p className="muted capitalize">
                  {u.role === "owner" ? "Shop owner" : u.role}
                  {u.shop?.name ? ` · ${u.shop.name}` : u.role === "customer" ? " · no shop" : ""}
                </p>
              </div>
              <form action={setUserActive} className="flex items-center gap-3">
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value={String(!u.active)} />
                <Badge tone={u.active ? "ok" : "bad"}>{u.active ? "Active" : "Deactivated"}</Badge>
                <SubmitButton className="btn-outline !px-4 !py-2">{u.active ? "Deactivate" : "Reactivate"}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <p className="muted mt-3">Deactivating never deletes records. A deactivated user cannot sign in until reactivated.</p>
      </div>
    </>
  );
}
