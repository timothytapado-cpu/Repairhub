"use client";
import { useEffect, useState } from "react";
import { openStatus } from "@/lib/util";

/** "Open now · closes 7:00 PM" / "Closed · opens 9:00 AM" pill. Computed in the browser so it uses the visitor's clock. */
export function OpenPill({ hours, short }: { hours: string | null | undefined; short?: boolean }) {
  const [s, setS] = useState<ReturnType<typeof openStatus>>(null);
  useEffect(() => setS(openStatus(hours)), [hours]);
  if (!s) return null;
  return <span className={`badge ${s.open ? "bg-ok-bg text-ok-text" : "bg-bad-bg text-bad-text"}`}>{short ? (s.open ? "Open now" : "Closed") : s.label}</span>;
}
