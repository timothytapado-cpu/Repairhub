"use client";
import { useState } from "react";

/** File input with an instant preview. Submits the file under `name`. */
export function ImageInput({ name = "image", label = "Product photo" }: { name?: string; label?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState("");
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-canvas text-xs text-ink-soft">
          {src ? <img src={src} alt="Preview" className="h-full w-full object-cover" /> : "No photo"}
        </div>
        <div className="min-w-0">
          <input
            type="file"
            name={name}
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return setSrc(null);
              if (f.size > 5 * 1024 * 1024) {
                setErr("Photo must be 5 MB or smaller.");
                e.target.value = "";
                return setSrc(null);
              }
              setErr("");
              setSrc(URL.createObjectURL(f));
            }}
          />
          <p className="muted mt-1">JPG, PNG or WebP, up to 5 MB.</p>
          {err && <p className="mt-1 text-sm text-red-700">{err}</p>}
        </div>
      </div>
    </div>
  );
}
