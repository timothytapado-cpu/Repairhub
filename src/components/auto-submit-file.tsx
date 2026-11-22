"use client";

/** Hidden file input that submits its parent form as soon as a file is chosen. */
export function AutoSubmitFile({ name = "image", accept = "image/jpeg,image/png,image/webp" }: { name?: string; accept?: string }) {
  return (
    <input
      type="file"
      name={name}
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.currentTarget.files?.[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
          alert("Photo must be 5 MB or smaller.");
          e.currentTarget.value = "";
          return;
        }
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
