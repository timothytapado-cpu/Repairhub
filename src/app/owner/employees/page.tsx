import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { addTechnician, toggleEmployee } from "@/app/actions";
import { Badge, Flash } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Employees({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: team } = await sb.from("profiles").select("id,full_name,phone,active").eq("shop_id", p!.shop_id).eq("role", "technician").order("full_name");
  const { data: open } = await sb.from("tickets").select("technician_id,status").eq("shop_id", p!.shop_id).not("status", "in", "(done,cancelled)");
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Employees</h1>
      <Flash msg={sp.msg} error={sp.error} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card overflow-x-auto !p-0 lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-soft">
              <tr>
                {["Technician", "Phone", "Open jobs", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {team?.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-semibold">{m.full_name}</td>
                  <td className="px-4 py-3">{m.phone}</td>
                  <td className="px-4 py-3">{open?.filter((t) => t.technician_id === m.id).length ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.active ? "ok" : "rejected"}>{m.active ? "Active" : "Deactivated"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleEmployee}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value={String(!m.active)} />
                      <button className="text-xs font-semibold text-brand">{m.active ? "Deactivate" : "Reactivate"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!team?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                    No technicians yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form action={addTechnician} className="card space-y-3">
          <h2 className="font-semibold">Add technician</h2>
          <input className="input" name="full_name" placeholder="Full name" required />
          <input className="input" name="phone" placeholder="Mobile number" />
          <input className="input" name="email" type="email" placeholder="Login email" required />
          <input className="input" name="password" type="text" minLength={8} placeholder="Temporary password" required />
          <button className="btn-primary w-full">Create account</button>
          <p className="muted">Share the email and temporary password with your technician. Basic plan: up to 2 staff.</p>
        </form>
      </div>
    </>
  );
}
