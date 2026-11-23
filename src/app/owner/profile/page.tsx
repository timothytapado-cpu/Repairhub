import { SubmitButton } from "@/components/submit-button";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { addService, addShopPhoto, deleteService, removeShopLogo, removeShopPhoto, updateShop, uploadShopLogo } from "@/app/actions";
import { Flash, ShopAvatar } from "@/components/ui";
import { ImageInput } from "@/components/image-input";
import { LocationPicker } from "@/components/shop-map";
import { peso } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function ShopProfile({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("*, shop_services(*)").eq("id", p!.shop_id).single();
  if (!shop) return <p>No shop found.</p>;
  const { data: photos } = await sb.from("shop_photos").select("id,url").eq("shop_id", p!.shop_id).order("created_at");
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="h-page">Shop profile</h1>
      <Flash msg={sp.msg} error={sp.error} />

      <div className="card space-y-6 !p-6">
        <div>
          <h2 className="h-card">Logo / profile picture</h2>
          <p className="muted mt-1">Shown next to your shop name in search results and on your shop page. A square image works best.</p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <ShopAvatar name={shop.name} logo={shop.logo_url} className="h-24 w-24 text-3xl" />
            <div className="min-w-0 flex-1">
              <form action={uploadShopLogo} className="space-y-3">
                <ImageInput name="image" label={shop.logo_url ? "Replace logo" : "Upload your logo"} />
                <SubmitButton className="btn-primary" pendingText="Uploading…">
                  Save logo
                </SubmitButton>
              </form>
              {shop.logo_url && (
                <form action={removeShopLogo} className="mt-2">
                  <SubmitButton className="text-sm font-bold text-[#a61e14]" pendingText="Removing…">
                    Remove logo
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="h-card">Shop photos</h2>
          <p className="muted mt-1">Show customers your storefront, repair bench or accessories. Up to 6 photos ({photos?.length ?? 0} used).</p>
          {photos && photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((ph) => (
                <div key={ph.id} className="overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt="Shop photo" className="aspect-[4/3] w-full object-cover" />
                  <form action={removeShopPhoto} className="p-2 text-center">
                    <input type="hidden" name="id" value={ph.id} />
                    <SubmitButton className="text-xs font-bold text-[#a61e14]" pendingText="Removing…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              ))}
            </div>
          )}
          {(photos?.length ?? 0) < 6 ? (
            <form action={addShopPhoto} className="mt-4 space-y-3">
              <ImageInput name="image" label="Add a photo" />
              <SubmitButton className="btn-outline" pendingText="Uploading…">
                Add photo
              </SubmitButton>
            </form>
          ) : (
            <p className="muted mt-4">You have reached 6 photos. Remove one to add another.</p>
          )}
        </div>
      </div>
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
            <input className="input" name="phone" defaultValue={shop.phone} required inputMode="tel" />
          </div>
          <div>
            <label className="label">Contact email</label>
            <input className="input" name="email" type="email" defaultValue={shop.email} placeholder="shop@example.com" />
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
        <SubmitButton className="btn-primary">Save changes</SubmitButton>
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
                <SubmitButton className="text-xs font-semibold text-red-700">Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addService} className="mt-3 flex gap-2">
          <input className="input" name="name" placeholder="Service name" required />
          <input className="input !w-32" name="price_from" type="number" min={0} placeholder="₱ from" />
          <SubmitButton className="btn-outline shrink-0">Add</SubmitButton>
        </form>
      </div>
    </div>
  );
}
