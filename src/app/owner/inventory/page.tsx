import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { adjustStock, deleteProduct, toggleForSale, updateProductImage } from "@/app/actions";
import { Badge, Flash, PageHead, Stat } from "@/components/ui";
import { AutoSubmitFile } from "@/components/auto-submit-file";
import { PLAN_LIMITS, peso } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function Inventory({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string; q?: string; low?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("plan").eq("id", p!.shop_id).maybeSingle();
  const plan = (shop?.plan ?? "basic") as "basic" | "pro";
  const { data: items } = await sb.from("products").select("*").eq("shop_id", p!.shop_id).order("name");
  const all = items ?? [];
  const lowAll = all.filter((i) => i.qty <= i.low_threshold);
  const term = (sp.q ?? "").trim().toLowerCase();
  const shown = all.filter((i) => (sp.low ? i.qty <= i.low_threshold : true) && (!term || `${i.name} ${i.sku}`.toLowerCase().includes(term)));
  const units = all.reduce((a, i) => a + i.qty, 0);
  const limit = PLAN_LIMITS[plan].items;

  return (
    <>
      <PageHead
        title="Inventory"
        sub='Parts for repairs and items you sell. Items marked "On shop page" appear on your public profile.'
        action={
          <Link href="/owner/inventory/new" className="btn-primary">
            Add product
          </Link>
        }
      />
      <Flash msg={sp.msg} error={sp.error} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Products" value={all.length} hint="Unique items" />
        <Stat label="Total stock" value={units} hint="Units available" />
        <Stat label="Low on stock" value={lowAll.length} hint="Products need attention" tone={lowAll.length ? "warn" : undefined} />
      </div>

      {lowAll.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warn-bg px-5 py-4 text-warn-text">
          <p className="text-sm font-bold">
            Low on stock: {lowAll.length} product{lowAll.length === 1 ? "" : "s"}. {lowAll.slice(0, 2).map((i) => i.name).join(" and ")} {lowAll.length === 1 ? "is" : "are"} at or below the alert level. Restock soon.
          </p>
          <Link href="?low=1" className="btn-outline !bg-white">
            View low stock
          </Link>
        </div>
      )}

      <div className="card mt-4 !p-5">
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q ?? ""} className="input min-w-0 flex-1" placeholder="Search by product name or SKU" />
          {sp.low && <input type="hidden" name="low" value="1" />}
          <button className="btn-outline">Search</button>
          <Link href="/owner/inventory" className={sp.low ? "chip" : "chip-on"}>
            All products
          </Link>
          <Link href="?low=1" className={sp.low ? "chip-on" : "chip"}>
            Low stock ({lowAll.length})
          </Link>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Product", "SKU", "In stock", "Alert at", "Price", "Status", "Adjust", ""].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {shown.map((i) => {
                const isLow = i.qty <= i.low_threshold;
                return (
                  <tr key={i.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#d9def2] text-[10px] font-bold text-ink-soft">
                          {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : "PHOTO"}
                        </div>
                        <div>
                          <div className="font-extrabold">{i.name}</div>
                          <div className="muted text-xs">
                            {i.category} · {i.for_sale ? "On shop page" : "Repair part only"}
                          </div>
                          <form action={updateProductImage} encType="multipart/form-data">
                            <input type="hidden" name="id" value={i.id} />
                            <label className="cursor-pointer text-xs font-bold text-brand-600">
                              {i.image_url ? "Change photo" : "Add photo"}
                              <AutoSubmitFile />
                            </label>
                          </form>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{i.sku}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-extrabold">{i.qty} unit{i.qty === 1 ? "" : "s"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{i.low_threshold} unit{i.low_threshold === 1 ? "" : "s"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{i.for_sale ? peso(i.price) : "Not for sale"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{isLow ? <Badge tone="low">Low on stock</Badge> : <Badge tone="ok">In stock</Badge>}</td>
                    <td className="px-4 py-3">
                      <form action={adjustStock} className="flex gap-1">
                        <input type="hidden" name="id" value={i.id} />
                        <button name="delta" value="-1" className="btn-outline !px-3 !py-1">
                          −
                        </button>
                        <button name="delta" value="1" className="btn-outline !px-3 !py-1">
                          +
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs font-bold">
                        <form action={toggleForSale}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="for_sale" value={String(!i.for_sale)} />
                          <button className="text-brand-600">{i.for_sale ? "Hide from shop" : "Show on shop"}</button>
                        </form>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={i.id} />
                          <button className="text-[#a61e14]">Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">
                    {all.length ? "No products match." : "No products yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="muted mt-3">
          Showing {sp.low || term ? `${shown.length} of ${all.length}` : `all ${all.length}`} products · {all.length} of {Number.isFinite(limit) ? limit : "unlimited"} items used on your plan.
        </p>
      </div>
    </>
  );
}
