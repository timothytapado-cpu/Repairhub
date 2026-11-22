import Link from "next/link";
import { STATUS_LABEL } from "@/lib/util";

const TONE: Record<string, string> = {
  new: "bg-brand-50 text-brand-600",
  received: "bg-[#e9ecf8] text-ink",
  in_progress: "bg-warn-bg text-warn-text",
  ready: "bg-ok-bg text-ok-text",
  done: "bg-ok-bg text-ok-text",
  cancelled: "bg-bad-bg text-bad-text",
  pending: "bg-warn-bg text-warn-text",
  approved: "bg-ok-bg text-ok-text",
  rejected: "bg-bad-bg text-bad-text",
  low: "bg-warn-bg text-warn-text",
  ok: "bg-ok-bg text-ok-text",
  bad: "bg-bad-bg text-bad-text",
  info: "bg-brand-50 text-brand-600",
};

export function Badge({ tone, children }: { tone: string; children?: React.ReactNode }) {
  return <span className={`badge ${TONE[tone] ?? "bg-[#e9ecf8] text-ink"}`}>{children ?? STATUS_LABEL[tone] ?? tone}</span>;
}

/** Compact brand mark (logo icon + name). `light` = shown on a dark/navy background. */
export function Logo({ light, name = "Mobile RepairHub" }: { light?: boolean; name?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 text-lg font-extrabold ${light ? "text-white" : "text-ink"}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${light ? "bg-white p-1" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Phone RepairShop logo" className="h-full w-full object-contain" />
      </span>
      {name}
    </Link>
  );
}

/** Full stacked logo (icon, wordmark and tagline). The white background blends into light pages. */
export function LogoFull({ className = "h-40" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Phone RepairShop – Find a Repair Shop Near You" className={`mx-auto w-auto mix-blend-multiply ${className}`} />
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "warn" | "bad" }) {
  return (
    <div className="card">
      <div className="text-sm font-bold text-ink-soft">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${tone === "warn" ? "text-[#7a5200]" : tone === "bad" ? "text-bad-text" : ""}`}>{value}</div>
      {hint && <div className="muted mt-1">{hint}</div>}
    </div>
  );
}

export function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (!msg && !error) return null;
  return (
    <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-bad-bg text-bad-text" : "bg-ok-bg text-ok-text"}`}>{error ?? msg}</div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-label={`${value} out of 5`}>
      {"★".repeat(Math.round(value))}
      <span className="text-line-strong">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

/** Page heading used in the workspaces: title, one-line description and an optional action on the right. */
export function PageHead({ title, sub, action }: { title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="h-page">{title}</h1>
        {sub && <p className="muted mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
