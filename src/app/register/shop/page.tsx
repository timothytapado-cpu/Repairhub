import Link from "next/link";
import { signUpShop } from "@/app/actions";
import { Flash, Logo } from "@/components/ui";
import { LocationPicker } from "@/components/shop-map";
import { PLAN } from "@/lib/util";

const STEPS = ["Owner account", "Shop info", "Plan", "Documents", "Admin approval"];
const STATUS = [
  ["Submitted", "Your registration is saved. You cannot take bookings yet.", "bg-[#e9ecf8] text-ink", "bg-ink-soft"],
  ["Under admin review", "An admin checks your shop info and documents.", "bg-warn-bg text-warn-text", "bg-[#7a5200]"],
  ["Approved", "Your shop goes live, shows as Verified, and billing starts.", "bg-ok-bg text-ok-text", "bg-[#0b7a45]"],
  ["Rejected", "You see the reason from the admin, fix it, and resubmit. Nothing is lost.", "bg-bad-bg text-bad-text", "bg-[#b4231a]"],
];

export default async function RegisterShop({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-3">
          <Logo />
          <Link href="/login" className="text-sm font-bold text-brand-600">
            Back to sign in
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1160px] px-5 py-10">
        <h1 className="h-page text-4xl">Register your shop</h1>
        <p className="muted mt-1">Your shop goes live only after a system admin approves it.</p>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 py-3 text-sm font-bold ${i === STEPS.length - 1 ? "border-line text-ink-soft" : "border-line-strong"}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs text-white ${i === STEPS.length - 1 ? "bg-line-strong" : "bg-brand"}`}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <Flash error={sp.error} />
        </div>
        <form action={signUpShop} encType="multipart/form-data" className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="card !p-6">
              <h2 className="h-card">Owner account</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" name="full_name" required />
                </div>
                <div>
                  <label className="label">Mobile number</label>
                  <input className="input" name="phone" inputMode="tel" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" name="email" type="email" required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" name="password" type="password" minLength={8} required />
                </div>
              </div>
            </section>

            <section className="card !p-6">
              <h2 className="h-card">Shop info</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Shop name</label>
                  <input className="input" name="shop_name" required />
                </div>
                <div>
                  <label className="label">Street address</label>
                  <input className="input" name="address" required />
                </div>
                <div>
                  <label className="label">Barangay / Town</label>
                  <input className="input" name="barangay" />
                </div>
                <div>
                  <label className="label">Shop contact number</label>
                  <input className="input" name="shop_phone" inputMode="tel" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">About the shop</label>
                  <textarea className="input" name="description" rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Services (one per line, “Name - starting price”)</label>
                  <textarea className="input" name="services" rows={4} defaultValue={"Screen replacement - 1500\nBattery replacement - 600\nCharging port repair - 500"} />
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Shop location</label>
                <LocationPicker />
              </div>
            </section>

            <section className="card !p-6">
              <h2 className="h-card">Subscription plan</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(["basic", "pro"] as const).map((k, i) => (
                  <label key={k} className="flex cursor-pointer gap-3 rounded-2xl border-[1.5px] border-line-strong bg-white p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-50">
                    <input type="radio" name="plan" value={k} defaultChecked={i === 1} className="mt-1.5 accent-[#2f5bff]" />
                    <span>
                      <span className="block font-extrabold">{PLAN[k].name}</span>
                      <span className="block text-xl font-extrabold">₱{PLAN[k].price} per month</span>
                      <span className="muted mt-1 block">{PLAN[k].blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="muted mt-3">Payment is simulated in this capstone demo. No real charge is made. You can change plans later in Subscription.</p>
            </section>

            <section className="card !p-6">
              <h2 className="h-card">Verification document</h2>
              <p className="muted mt-1">The admin checks this before approving your shop. JPG, PNG or PDF, up to 5 MB.</p>
              <div className="mt-4 rounded-xl border border-line p-4">
                <p className="mb-2 text-sm font-bold">Business permit or DTI registration</p>
                <input className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-bold file:text-brand-600" type="file" name="permit" accept="image/*,application/pdf" />
              </div>
            </section>

            <div className="flex items-center justify-between">
              <Link href="/login" className="btn-outline">
                Cancel registration
              </Link>
              <button className="btn-primary">Submit for approval</button>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-4">
            <h2 className="h-card">After you submit</h2>
            <p className="muted mt-2">You see this status every time you sign in until a decision is made.</p>
            <div className="mt-4 space-y-3">
              {STATUS.map(([t, d, tone, dot]) => (
                <div key={t} className={`rounded-xl p-4 ${tone}`}>
                  <p className="flex items-center gap-2 text-sm font-extrabold">
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    {t}
                  </p>
                  <p className="mt-1 text-sm">{d}</p>
                </div>
              ))}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
