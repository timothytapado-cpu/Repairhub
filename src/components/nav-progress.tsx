"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Thin brand-blue bar at the top of the page that runs from a link click until the next page has arrived. */
export function NavProgress() {
  const path = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);

  // the new page arrived (compare the URL text, not the object, which can change identity on every render)
  const here = `${path}?${search.toString()}`;
  useEffect(() => setActive(false), [here]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      // runs in the capture phase, before Next's own link handler, so e.defaultPrevented is not usable here
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[3000] h-[3px] w-full" role="progressbar" aria-label="Loading page">
      <div key={String(active)} className="nav-progress-bar h-full rounded-r-full bg-brand shadow-[0_0_8px_rgba(47,91,255,0.7)]" />
    </div>
  );
}
