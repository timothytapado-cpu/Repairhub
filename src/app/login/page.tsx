import Link from "next/link";
import { signIn } from "@/app/actions";
import { Flash, Logo, LogoFull } from "@/components/ui";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; msg?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-navy p-12 text-white md:flex md:flex-col md:justify-center">
        <Logo light />
        <h1 className="mt-8 max-w-md text-5xl font-extrabold leading-[1.1] tracking-tight">
          Welcome to <span className="text-[#7f9bff]">RepairHub</span> all your mobile device repair needs in one place.
        </h1>
        <p className="mt-6 max-w-md text-lg text-on-dark">Your trusted partner for mobile repairs. Find a repair shop near you, book a repair, and follow every step.</p>
      </div>
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-[400px]">
          <LogoFull className="mb-4 h-32 md:hidden" />
          <h2 className="text-3xl font-extrabold tracking-tight">Sign in</h2>
          <p className="muted mb-6 mt-2">Welcome back. Enter your email and password.</p>
          <Flash msg={sp.msg} error={sp.error} />
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="next" value={sp.next ?? ""} />
            <div>
              <label className="label">Email</label>
              <input className="input !py-3" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input !py-3" name="password" type="password" required autoComplete="current-password" placeholder="Your password" />
            </div>
            <button className="btn-primary w-full !py-3">Sign in</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-sm text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            New here?
            <span className="h-px flex-1 bg-line" />
          </div>
          <Link href="/register" className="btn-outline w-full !py-3">
            Create an account
          </Link>
          <p className="mt-5 text-center text-sm text-ink-soft">
            Own a repair shop?{" "}
            <Link href="/register/shop" className="font-bold text-brand-600">
              Register your shop
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
