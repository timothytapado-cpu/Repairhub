/** Placeholder shapes shown while a page loads. They echo the real layouts so nothing jumps. */

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm font-bold text-ink-soft">
      <span className="spinner !h-5 !w-5 text-brand" />
      {label}
    </div>
  );
}

/** Heading + a row of stat cards + two content cards (workspace pages). */
export function ContentSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-5">
      <div>
        <div className="skeleton h-9 w-64" />
        <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-8 w-16" />
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="card space-y-3 !p-6">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="card space-y-3 !p-6">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}

/** Top bar + hero + cards (public and customer pages). */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4">
          <div className="skeleton h-9 w-44" />
          <div className="skeleton h-9 w-28" />
        </div>
      </div>
      <div className="bg-navy">
        <div className="mx-auto max-w-[1240px] space-y-4 px-5 py-14">
          <div className="h-4 w-48 animate-pulse rounded bg-white/20" />
          <div className="h-12 w-3/4 max-w-xl animate-pulse rounded bg-white/20" />
          <div className="h-12 w-1/2 max-w-md animate-pulse rounded bg-white/20" />
          <div className="h-14 w-full max-w-2xl animate-pulse rounded-2xl bg-white/20" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1240px] gap-5 px-5 py-10 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-4 w-64 max-w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="skeleton min-h-[360px]" />
      </div>
      <div className="flex justify-center pb-10">
        <Spinner />
      </div>
    </div>
  );
}
