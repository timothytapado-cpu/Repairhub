import Link from "next/link";
import { addProduct } from "@/app/actions";
import { Flash } from "@/components/ui";
import { ImageInput } from "@/components/image-input";
import { PRODUCT_CATEGORIES } from "@/lib/util";

export default async function AddProduct({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-2xl">
      <p className="muted">Inventory</p>
      <h1 className="mb-4 text-2xl font-bold">Add product</h1>
      <Flash error={sp.error} />
      <form action={addProduct} encType="multipart/form-data" className="card space-y-4">
        <ImageInput />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Product name</label>
            <input className="input" name="name" required placeholder="e.g. Galaxy A54 clear case" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" name="category">
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" name="sku" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Short description</label>
            <input className="input" name="description" placeholder="Fits Galaxy A54 · shockproof · 3 colors" />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input className="input" name="qty" type="number" min={0} defaultValue={0} required />
          </div>
          <div>
            <label className="label">Low-stock alert at</label>
            <input className="input" name="low_threshold" type="number" min={0} defaultValue={3} />
          </div>
          <div>
            <label className="label">Price (₱)</label>
            <input className="input" name="price" type="number" min={0} step="0.01" required />
          </div>
          <label className="flex items-center gap-2 pt-7 text-sm">
            <input type="checkbox" name="for_sale" defaultChecked /> Show to customers on my shop page
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Link href="/owner/inventory" className="btn-outline">
            Cancel
          </Link>
          <button className="btn-primary">Save product</button>
        </div>
      </form>
    </div>
  );
}
