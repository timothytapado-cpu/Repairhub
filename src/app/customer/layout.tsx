import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell";
import { signOut, markNotificationsRead } from "@/app/actions";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const p = await requireRole("customer");
  const sb = await supabaseServer();
  const { data: notes } = await sb.from("notifications").select("*").eq("user_id", p.id).order("created_at", { ascending: false }).limit(6);
  const unread = notes?.filter((n) => !n.read).length ?? 0;
  const short = p.full_name.split(" ").map((w, i) => (i === 0 ? w : w[0] + ".")).slice(0, 2).join(" ");
  return (
    <>
      <TopBar
        links={[
          { href: "/customer", label: "Find a shop" },
          { href: "/customer/tickets", label: "My repairs" },
        ]}
        right={
          <>
            <details className="relative">
              <summary className="btn-outline cursor-pointer list-none !px-4 !py-2">
                Notifications{unread ? <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white">{unread}</span> : null}
              </summary>
              <div className="absolute right-0 z-[1000] mt-2 w-80 rounded-2xl border border-line bg-white p-4 shadow-lg">
                {notes?.length ? (
                  <ul className="space-y-2 text-sm">
                    {notes.map((n) => (
                      <li key={n.id} className={n.read ? "text-ink-soft" : "font-bold"}>
                        {n.body}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Nothing yet.</p>
                )}
                {unread > 0 && (
                  <form action={markNotificationsRead} className="mt-3">
                    <button className="btn-outline w-full !py-1.5">Mark all read</button>
                  </form>
                )}
              </div>
            </details>
            <form action={signOut}>
              <button className="text-sm font-bold text-ink-soft hover:text-ink">
                {short} · Log out
              </button>
            </form>
          </>
        }
      />
      <div className="mx-auto max-w-[1240px] px-5 py-8">{children}</div>
    </>
  );
}
