import Link from "next/link";
import { Badge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function MyRepairs() {
  const me = await getProfile();
  const sb = await supabaseServer();
  const { data } = await sb.from("tickets").select("id,code,device,issue,status,created_at,shops(name)").eq("customer_id", me!.id).order("created_at", { ascending: false });
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">My repairs</h1>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-soft">
            <tr>
              {["Ticket", "Device", "Issue", "Shop", "Date", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.map((t: any) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-semibold">{t.code}</td>
                <td className="px-4 py-3">{t.device}</td>
                <td className="px-4 py-3">{t.issue}</td>
                <td className="px-4 py-3">{t.shops?.name}</td>
                <td className="px-4 py-3">{fmtDate(t.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/customer/tickets/${t.id}`} className="font-semibold text-brand">
                    Track
                  </Link>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                  No repairs yet. <Link href="/customer" className="font-semibold text-brand">Find a shop</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
