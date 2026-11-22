"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./shell";

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="mt-7 flex flex-row flex-wrap gap-1 md:flex-col">
      {items.map((i) => {
        const active = path === i.href || path.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`}
          >
            {i.label}
            {i.badge ? <span className="ml-2 text-xs font-semibold text-white/75">{i.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
