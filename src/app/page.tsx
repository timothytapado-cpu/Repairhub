import Link from "next/link";
import { TopBar } from "@/components/shell";
import { LandingFinder } from "@/components/landing-finder";
import { loadFinderShops } from "@/lib/data";
import { getProfile, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [shops, me] = await Promise.all([loadFinderShops(), getProfile()]);
  return (
    <>
      <TopBar
        active="Find a shop"
        links={[
          { href: "#shops", label: "Find a shop" },
          { href: "#how", label: "How it works" },
          { href: "/register/shop", label: "List your shop" },
        ]}
        right={
          me ? (
            <Link href={homeFor(me.role)} className="btn-primary">
              Open my workspace
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              Log in
            </Link>
          )
        }
      />
      <LandingFinder shops={shops} />
      <section id="how" className="mx-auto grid max-w-[1240px] gap-4 px-5 pb-14 md:grid-cols-3">
        {[
          ["1. Find a shop near you", "Share your location or type an address. The map and list show the closest verified shops."],
          ["2. Send a repair request", "Log in, describe the phone and the problem, and pick a date. The shop accepts or declines."],
          ["3. Track with photos", "Follow each step and see the technician's before and after photos. Rate the shop when done."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="text-lg font-extrabold">{t}</h3>
            <p className="muted mt-1">{d}</p>
          </div>
        ))}
      </section>
      <footer className="bg-navy py-6 text-sm text-on-dark">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-5">
          <span>Mobile RepairHub · Find independent phone repair shops in your town.</span>
          <span>Laguna State Polytechnic University – Siniloan Campus capstone project</span>
        </div>
      </footer>
    </>
  );
}
