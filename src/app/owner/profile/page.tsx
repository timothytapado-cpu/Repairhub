import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { addService, deleteService, updateShop } from "@/app/actions";
import { Flash } from "@/components/ui";
import { LocationPicker } from "@/components/shop-map";
import { peso } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function ShopProfile({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("*, shop_services(*)").eq("id", p!.shop_id).single();
  if (!shop) return <p>No shop found.</p>;
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Shop profile</h1>
      <Flash msg={sp.msg} error={sp.error} />
      <form action={updateShop} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Shop name</label>
            <input className="input" name="name" defaultValue={shop.name} required />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" name="address" defaultValue={shop.address} required />
          </div>
          <div>
            <label className="label">Barangay / Town</label>
            <input className="input" name="barangay" defaultValue={shop.barangay} />
          </div>
          <div>
            <label className="label">Contact number</label>
            <input className="input" name="phone" defaultValue={shop.phone} />
          </div>
          <div>
            <label className="label">Opening hours</label>
            <input className="input" name="hours" defaultValue={shop.hours} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">About</label>
            <textarea className="input" name="description" rows={3} defaultValue={shop.description} />
          </div>
        </div>
        <div>
          <label className="label">Map pin</label>
          <LocationPicker lat={shop.lat} lng={shop.lng} />
        </div>
        <button className="btn-primary">Save changes</button>
      </form>

      <div className="card">
        <h2 className="mb-3 font-semibold">Services & starting prices</h2>
        <ul className="divide-y divide-line text-sm">
          {shop.shop_services.map((s: any) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span>
                {s.name} · from {peso(s.price_from)}
              </span>
              <form action={deleteService}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs font-semibold text-red-700">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addService} className="mt-3 flex gap-2">
          <input className="input" name="name" placeholder="Service name" required />
          <input className="input !w-32" name="price_from" type="number" min={0} placeholder="₱ from" />
          <button className="btn-outline shrink-0">Add</button>
        </form>
      </div>
    </div>
  );
}
