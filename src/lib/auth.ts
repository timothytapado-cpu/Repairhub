import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";

export type Role = "customer" | "owner" | "technician" | "admin";
export type Profile = { id: string; full_name: string; phone: string; role: Role; shop_id: string | null; active: boolean };

export const homeFor = (role: Role) =>
  ({ customer: "/customer", owner: "/owner/dashboard", technician: "/technician", admin: "/admin/overview" })[role];

export async function getProfile(): Promise<Profile | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

/** Use at the top of a role's layout. Sends the user to the right place if the role is wrong. */
export async function requireRole(role: Role): Promise<Profile> {
  const p = await getProfile();
  if (!p) redirect(role === "admin" ? "/admin-login" : "/login");
  if (p.role !== role) redirect(homeFor(p.role));
  return p;
}
