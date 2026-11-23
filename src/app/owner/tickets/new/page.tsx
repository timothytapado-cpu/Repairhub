import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Flash, PageHead } from "@/components/ui";
import { WalkInForm } from "@/components/repair-photos";

export const dynamic = "force-dynamic";

export default async function NewWalkIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: team } = await sb.from("profiles").select("id,full_name").eq("shop_id", p!.shop_id).eq("role", "technician").eq("active", true).order("full_name");
  return (
    <div className="max-w-3xl">
      <Link href="/owner/tickets" className="text-sm font-bold text-brand-600">
        ← Back to board
      </Link>
      <div className="mt-3">
        <PageHead title="New walk-in ticket" sub="For a customer who comes in without using the website. They get a normal ticket on the board, and the technician adds the before and after photos." />
      </div>
      <Flash error={sp.error} />
      <div className="card !p-6">
        <WalkInForm from="/owner/tickets/new" technicians={team ?? []} />
      </div>
    </div>
  );
}
