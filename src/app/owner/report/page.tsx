import { SubmitButton } from "@/components/submit-button";
import { submitReport } from "@/app/actions";
import { Flash } from "@/components/ui";

export default async function Report({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Report a problem</h1>
      <Flash msg={sp.msg} />
      <form action={submitReport} className="card space-y-3">
        <input type="hidden" name="from" value="/owner/report" />
        <textarea className="input" name="body" rows={5} placeholder="Describe the issue with the platform or a customer" required />
        <SubmitButton className="btn-primary">Send to administrators</SubmitButton>
      </form>
    </div>
  );
}
