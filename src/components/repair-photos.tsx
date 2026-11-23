import { uploadTicketPhoto, createWalkIn } from "@/app/actions";
import { SubmitButton } from "./submit-button";

/**
 * One photo step of a repair (before = phone opened up, after = repaired).
 * Shows the saved photo, plus a form to take or upload a new one.
 */
export function PhotoStep({
  ticketId,
  kind,
  url,
  from,
  canEdit = true,
}: {
  ticketId: string;
  kind: "before" | "after";
  url?: string;
  from: string;
  canEdit?: boolean;
}) {
  const before = kind === "before";
  return (
    <div className={`rounded-2xl border-[1.5px] p-4 ${url ? "border-line" : "border-brand"}`}>
      <h3 className="font-extrabold">{before ? "1. Before photo (required to start)" : "2. After photo (required to finish)"}</h3>
      <p className="muted mt-1">
        {before
          ? "Take a photo of the phone as you open it up, before any repair. The customer sees it with the In progress update."
          : "Take a photo of the repaired phone, switched on. The customer sees it with the Ready update."}
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block shrink-0 overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={before ? "Before photo" : "After photo"} className="h-28 w-40 object-cover" />
          </a>
        ) : (
          <div className="grid h-28 w-40 shrink-0 place-items-center rounded-xl bg-[#d9def2] text-xs font-bold text-ink-soft">{before ? "BEFORE PHOTO" : "AFTER PHOTO"}</div>
        )}
        <div className="min-w-0 flex-1">
          {url ? <p className="font-extrabold text-ok-text">Photo saved to the ticket</p> : <p className="font-extrabold text-bad-text">Required. Not uploaded yet.</p>}
          {canEdit && (
            <form action={uploadTicketPhoto} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={ticketId} />
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="from" value={from} />
              <input
                type="file"
                name="photo"
                required
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="min-w-0 max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-bold file:text-brand-600"
              />
              <SubmitButton className={url ? "btn-outline !py-2" : "btn-primary !py-2"} pendingText="Uploading…">
                {url ? "Replace photo" : "Upload photo"}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** Log a customer who walked in without an account. Used by technicians and the owner. */
export function WalkInForm({ from, technicians }: { from: string; technicians?: { id: string; full_name: string }[] }) {
  return (
    <form action={createWalkIn} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="from" value={from} />
      <div>
        <label className="label">Customer name</label>
        <input className="input" name="customer_name" required placeholder="e.g. Juan Dela Cruz" />
      </div>
      <div>
        <label className="label">Phone number</label>
        <input className="input" name="customer_phone" required inputMode="tel" placeholder="09XX XXX XXXX" />
      </div>
      <div>
        <label className="label">Phone model</label>
        <input className="input" name="device" required placeholder="e.g. Samsung Galaxy A54" />
      </div>
      <div>
        <label className="label">What needs fixing?</label>
        <input className="input" name="issue" required placeholder="e.g. Screen replacement" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Details (optional)</label>
        <textarea className="input" name="details" rows={2} placeholder="Cracked after a drop, touch still works…" />
      </div>
      {technicians && (
        <div className="sm:col-span-2">
          <label className="label">Technician</label>
          <select className="input" name="technician_id" defaultValue="">
            <option value="">Leave unassigned (a technician takes it)</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary" pendingText="Logging…">
          Log walk-in customer
        </SubmitButton>
      </div>
    </form>
  );
}
