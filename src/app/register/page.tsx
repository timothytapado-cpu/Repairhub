import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { signUpCustomer } from "@/app/actions";
import { Flash, Logo } from "@/components/ui";

export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-3">
          <Logo />
          <Link href="/login" className="text-sm font-bold text-brand-600">
            Back to sign in
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[460px] px-5 py-12">
        <h1 className="h-page">Create your account</h1>
        <p className="muted mb-6 mt-1">Request repairs and track them in one place.</p>
        <Flash error={sp.error} />
        <form action={signUpCustomer} className="card space-y-4 !p-6">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <div>
            <label className="label">Full name</label>
            <input className="input" name="full_name" required />
          </div>
          <div>
            <label className="label">Mobile number</label>
            <input className="input" name="phone" inputMode="tel" placeholder="09XX XXX XXXX" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" name="password" type="password" minLength={8} required />
          </div>
          <SubmitButton className="btn-primary w-full !py-3">Create account</SubmitButton>
        </form>
      </div>
    </div>
  );
}
