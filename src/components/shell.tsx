import Link from "next/link";
import { signOut } from "@/app/actions";
import { Logo } from "./ui";
import { NavLinks } from "./nav-links";
import { TopNav } from "./top-nav";

export type NavItem = { href: string; label: string; badge?: string | number | null };

/** Navy-sidebar workspace used by owner, technician and admin (matches the Figma screens). */
export function Shell({ workspace, nav, children, admin }: { workspace: string; nav: NavItem[]; children: React.ReactNode; admin?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className={`${admin ? "bg-[#131a45]" : "bg-navy"} px-4 py-6 text-white md:min-h-screen md:w-60 md:shrink-0`}>
        <Logo light />
        <p className="mt-1.5 text-xs text-on-dark">{workspace}</p>
        <NavLinks items={nav} />
        <form action={signOut} className="mt-1">
          <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/80 hover:bg-white/10">Log out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}

/** White top bar for the public site and the customer area (Figma: brand left, links right). */
export function TopBar({ links, right, active }: { links?: NavItem[]; right?: React.ReactNode; active?: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3">
        <Logo />
        <div className="flex items-center gap-6">
          {links && <TopNav links={links} active={active} />}
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </div>
    </header>
  );
}
