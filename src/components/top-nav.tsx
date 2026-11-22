"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type L = { href: string; label: string; badge?: string | number | null };

/** Top navigation links; the link for the current page is dark, the others muted (as in the Figma). */
export function TopNav({ links, active }: { links: L[]; active?: string }) {
  const path = usePathname();
  return (
    <nav className="hidden gap-6 text-sm font-bold md:flex">
      {links.map((l) => {
        const on = active ? active === l.label : !l.href.startsWith("#") && (path === l.href || (l.href !== "/" && path.startsWith(l.href + "/")));
        return (
          <Link key={l.href + l.label} href={l.href} className={on ? "text-ink" : "text-ink-soft hover:text-ink"}>
            {l.label}
            {l.badge ? <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">{l.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
