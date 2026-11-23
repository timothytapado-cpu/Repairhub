import { SubmitButton } from "@/components/submit-button";
import { signIn } from "@/app/actions";
import { Flash, LogoFull } from "@/components/ui";

// Private admin entry. Nothing on the public site links here and there is no admin sign-up.
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-navy p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7">
        <LogoFull className="mb-2 h-28" />
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Mobile RepairHub</p>
        <h1 className="mb-5 text-2xl font-bold">Admin console</h1>
        <Flash error={sp.error} />
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="expect" value="admin" />
          <input type="hidden" name="fail" value="/admin-login" />
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" name="password" type="password" required />
          </div>
          <SubmitButton className="btn-primary w-full">Sign in to console</SubmitButton>
        </form>
      </div>
    </div>
  );
}
