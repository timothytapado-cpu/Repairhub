"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { getProfile, homeFor, type Role } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/util";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const n = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;
const back = (path: string, kind: "error" | "msg", text: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(text)}`);

/* ---------- auth ---------- */
export async function signIn(f: FormData) {
  const sb = await supabaseServer();
  const failPath = s(f, "fail") || "/login";
  const { error } = await sb.auth.signInWithPassword({ email: s(f, "email"), password: s(f, "password") });
  if (error) back(failPath, "error", "Wrong email or password.");
  const p = await getProfile();
  if (!p) back(failPath, "error", "Account has no profile.");
  const want = s(f, "expect") as Role | "";
  if (want && p!.role !== want) {
    await sb.auth.signOut();
    back(failPath, "error", "This account cannot sign in here.");
  }
  if (!p!.active) {
    await sb.auth.signOut();
    back(failPath, "error", "This account has been deactivated.");
  }
  const next = s(f, "next");
  redirect(next.startsWith("/") ? next : homeFor(p!.role));
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/");
}

export async function signUpCustomer(f: FormData) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signUp({
    email: s(f, "email"),
    password: s(f, "password"),
    options: { data: { full_name: s(f, "full_name"), phone: s(f, "phone"), role: "customer" } },
  });
  if (error) back("/register", "error", error.message);
  const { data } = await sb.auth.getUser();
  if (!data.user) back("/login", "msg", "Account created. Check your email to confirm, then sign in.");
  redirect(s(f, "next").startsWith("/") ? s(f, "next") : "/customer");
}

export async function signUpShop(f: FormData) {
  const sb = await supabaseServer();
  const plan = s(f, "plan") === "pro" ? "pro" : "basic";
  const { data: auth, error } = await sb.auth.signUp({
    email: s(f, "email"),
    password: s(f, "password"),
    options: { data: { full_name: s(f, "full_name"), phone: s(f, "phone"), role: "owner" } },
  });
  if (error) back("/register/shop", "error", error.message);
  if (!auth.session || !auth.user) back("/login", "msg", "Account created. Confirm your email, then sign in to finish shop setup.");
  const uid = auth.user!.id;

  const paidUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10); // simulated payment
  const { data: shop, error: e2 } = await sb
    .from("shops")
    .insert({
      owner_id: uid,
      name: s(f, "shop_name"),
      description: s(f, "description"),
      address: s(f, "address"),
      barangay: s(f, "barangay"),
      lat: f.get("lat") ? n(f, "lat") : null,
      lng: f.get("lng") ? n(f, "lng") : null,
      phone: s(f, "shop_phone"),
      plan,
      plan_paid_until: paidUntil,
    })
    .select("id")
    .single();
  if (e2 || !shop) back("/register/shop", "error", e2?.message ?? "Could not create shop.");

  // services: one per line, "Name - price"
  const lines = s(f, "services").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length) {
    await sb.from("shop_services").insert(
      lines.map((l) => {
        const [name, price] = l.split(/[-:|]/).map((x) => x.trim());
        return { shop_id: shop!.id, name, price_from: Number(price?.replace(/[^\d.]/g, "")) || 0 };
      }),
    );
  }
  const file = f.get("permit");
  if (file instanceof File && file.size > 0) {
    const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const up = await sb.storage.from("permits").upload(path, file);
    if (!up.error) await sb.from("shops").update({ permit_url: path }).eq("id", shop!.id);
  }
  redirect("/owner/dashboard?msg=" + encodeURIComponent("Shop submitted. An administrator will review it before it goes public."));
}

/* ---------- customer ---------- */
export async function requestRepair(f: FormData) {
  const shopId = s(f, "shop_id");
  const p = await getProfile();
  if (!p) redirect(`/login?next=/shops/${shopId}`);
  if (p!.role !== "customer") back(`/shops/${shopId}`, "error", "Only customer accounts can request repairs.");
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("tickets")
    .insert({
      shop_id: shopId,
      customer_id: p!.id,
      customer_name: p!.full_name,
      device: s(f, "device"),
      issue: s(f, "issue"),
      details: s(f, "details"),
    })
    .select("id")
    .single();
  if (error) back(`/shops/${shopId}`, "error", error.message);
  redirect(`/customer/tickets/${data!.id}?msg=` + encodeURIComponent("Request sent. The shop will take it shortly."));
}

export async function cancelTicket(f: FormData) {
  const sb = await supabaseServer();
  const id = s(f, "id");
  await sb.from("tickets").update({ status: "cancelled" }).eq("id", id);
  revalidatePath("/customer");
  redirect(`/customer/tickets/${id}`);
}

export async function submitReview(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const shopId = s(f, "shop_id");
  const { error } = await sb.from("reviews").upsert(
    { shop_id: shopId, customer_id: p!.id, rating: n(f, "rating"), comment: s(f, "comment") },
    { onConflict: "shop_id,customer_id" },
  );
  if (error) back(`/shops/${shopId}`, "error", error.message);
  redirect(`/shops/${shopId}?msg=` + encodeURIComponent("Thanks for your review."));
}

export async function submitReport(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const from = s(f, "from") || "/";
  await sb.from("reports").insert({ reporter_id: p!.id, shop_id: s(f, "shop_id") || null, body: s(f, "body") });
  back(from, "msg", "Report sent to the administrators.");
}

export async function markNotificationsRead() {
  const sb = await supabaseServer();
  const p = await getProfile();
  await sb.from("notifications").update({ read: true }).eq("user_id", p!.id);
  revalidatePath("/", "layout");
}

/* ---------- tickets (owner / technician) ---------- */
export async function takeRequest(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const id = s(f, "id");
  await sb.from("tickets").update({ technician_id: p!.id, status: "received" }).eq("id", id).eq("status", "new");
  await sb.from("ticket_events").insert({ ticket_id: id, actor_id: p!.id, kind: "assign", body: `${p!.full_name} took the request` });
  revalidatePath("/technician");
  revalidatePath("/owner/tickets");
}

export async function setTicketStatus(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const id = s(f, "id");
  const status = s(f, "status");
  await sb.from("tickets").update({ status, estimate_note: s(f, "note") || undefined }).eq("id", id);
  await sb.from("ticket_events").insert({ ticket_id: id, actor_id: p!.id, kind: "status", body: `Status changed to ${status.replace("_", " ")}` });
  const note = s(f, "note");
  if (note) await sb.from("ticket_events").insert({ ticket_id: id, actor_id: p!.id, kind: "note", body: note });
  revalidatePath("/technician");
  revalidatePath("/owner/tickets");
  revalidatePath(`/owner/tickets/${id}`);
}

export async function assignTechnician(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const id = s(f, "id");
  const tech = s(f, "technician_id") || null;
  await sb.from("tickets").update({ technician_id: tech, status: tech ? "received" : "new" }).eq("id", id);
  await sb.from("ticket_events").insert({ ticket_id: id, actor_id: p!.id, kind: "assign", body: tech ? "Technician assigned" : "Technician removed" });
  revalidatePath(`/owner/tickets/${id}`);
  revalidatePath("/owner/tickets");
}

export async function sendMessage(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const body = s(f, "body");
  if (body) await sb.from("ticket_events").insert({ ticket_id: s(f, "id"), actor_id: p!.id, kind: "message", body });
  revalidatePath(s(f, "path") || "/");
}

/* ---------- inventory (Pro plan) ---------- */
async function requirePro() {
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("plan").eq("id", p!.shop_id).single();
  return { p: p!, sb, plan: (shop?.plan ?? "basic") as "basic" | "pro" };
}

/** Uploads a product photo to the public bucket under the shop's folder and returns its URL ("" if none). */
async function uploadProductImage(sb: Awaited<ReturnType<typeof supabaseServer>>, shopId: string, file: FormDataEntryValue | null, failPath: string) {
  if (!(file instanceof File) || file.size === 0) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) back(failPath, "error", "Photo must be a JPG, PNG or WebP image.");
  if (file.size > 5 * 1024 * 1024) back(failPath, "error", "Photo must be 5 MB or smaller.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
  const up = await sb.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (up.error) back(failPath, "error", "Photo upload failed: " + up.error.message);
  return sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export async function addProduct(f: FormData) {
  const { p, sb, plan } = await requirePro();
  if (plan === "basic") {
    const { count } = await sb.from("products").select("id", { count: "exact", head: true }).eq("shop_id", p.shop_id);
    if ((count ?? 0) >= PLAN_LIMITS.basic.items) back("/owner/inventory/new", "error", `The Basic plan allows ${PLAN_LIMITS.basic.items} inventory items. Upgrade to Pro for more.`);
  }
  const image_url = await uploadProductImage(sb, p.shop_id!, f.get("image"), "/owner/inventory/new");
  const { error } = await sb.from("products").insert({
    shop_id: p.shop_id,
    name: s(f, "name"),
    category: s(f, "category"),
    description: s(f, "description"),
    sku: s(f, "sku"),
    qty: n(f, "qty"),
    low_threshold: n(f, "low_threshold") || 3,
    price: n(f, "price"),
    for_sale: f.get("for_sale") === "on",
    image_url,
  });
  if (error) back("/owner/inventory/new", "error", error.message);
  redirect("/owner/inventory?msg=" + encodeURIComponent("Product added."));
}

export async function updateProductImage(f: FormData) {
  const { p, sb } = await requirePro();
  const image_url = await uploadProductImage(sb, p.shop_id!, f.get("image"), "/owner/inventory");
  if (image_url) await sb.from("products").update({ image_url }).eq("id", s(f, "id"));
  revalidatePath("/owner/inventory");
}

export async function toggleForSale(f: FormData) {
  const { sb } = await requirePro();
  await sb.from("products").update({ for_sale: f.get("for_sale") === "true" }).eq("id", s(f, "id"));
  revalidatePath("/owner/inventory");
}

export async function adjustStock(f: FormData) {
  const { sb } = await requirePro();
  const id = s(f, "id");
  const { data } = await sb.from("products").select("qty").eq("id", id).single();
  await sb.from("products").update({ qty: Math.max(0, (data?.qty ?? 0) + n(f, "delta")) }).eq("id", id);
  revalidatePath("/owner/inventory");
}

export async function deleteProduct(f: FormData) {
  const { sb } = await requirePro();
  await sb.from("products").delete().eq("id", s(f, "id"));
  revalidatePath("/owner/inventory");
}

/* ---------- employees ---------- */
export async function addTechnician(f: FormData) {
  const p = await getProfile();
  const sb = await supabaseServer();
  const { data: shop } = await sb.from("shops").select("plan").eq("id", p!.shop_id).single();
  const { count } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("shop_id", p!.shop_id).eq("role", "technician");
  if (shop?.plan === "basic" && (count ?? 0) >= 2) back("/owner/employees", "error", "Basic plan allows up to 2 staff. Upgrade to Pro for more.");
  const { error } = await supabaseAdmin().auth.admin.createUser({
    email: s(f, "email"),
    password: s(f, "password"),
    email_confirm: true,
    user_metadata: { full_name: s(f, "full_name"), phone: s(f, "phone"), role: "technician", shop_id: p!.shop_id },
  });
  if (error) back("/owner/employees", "error", error.message);
  redirect("/owner/employees?msg=" + encodeURIComponent("Technician account created."));
}

export async function toggleEmployee(f: FormData) {
  const sb = await supabaseServer();
  await sb.from("profiles").update({ active: f.get("active") === "true" }).eq("id", s(f, "id"));
  revalidatePath("/owner/employees");
}

/* ---------- shop profile & plan ---------- */
export async function updateShop(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const { error } = await sb
    .from("shops")
    .update({
      name: s(f, "name"),
      description: s(f, "description"),
      address: s(f, "address"),
      barangay: s(f, "barangay"),
      phone: s(f, "phone"),
      hours: s(f, "hours"),
      lat: f.get("lat") ? n(f, "lat") : null,
      lng: f.get("lng") ? n(f, "lng") : null,
    })
    .eq("id", p!.shop_id);
  if (error) back("/owner/profile", "error", error.message);
  redirect("/owner/profile?msg=" + encodeURIComponent("Shop profile saved."));
}

export async function addService(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  await sb.from("shop_services").insert({ shop_id: p!.shop_id, name: s(f, "name"), price_from: n(f, "price_from") });
  revalidatePath("/owner/profile");
}
export async function deleteService(f: FormData) {
  const sb = await supabaseServer();
  await sb.from("shop_services").delete().eq("id", s(f, "id"));
  revalidatePath("/owner/profile");
}

export async function changePlan(f: FormData) {
  const sb = await supabaseServer();
  const p = await getProfile();
  const plan = s(f, "plan") === "pro" ? "pro" : "basic";
  // Payment is simulated for the capstone demo. A real gateway (PayMongo/GCash) would confirm before this runs.
  const paidUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  await sb.from("shops").update({ plan, plan_paid_until: paidUntil }).eq("id", p!.shop_id);
  redirect("/owner/subscription?msg=" + encodeURIComponent(`You are now on the ${plan === "pro" ? "Pro" : "Basic"} plan (simulated payment).`));
}

/* ---------- admin ---------- */
export async function reviewShop(f: FormData) {
  const sb = await supabaseServer();
  const approve = s(f, "decision") === "approve";
  await sb.from("shops").update({ status: approve ? "approved" : "rejected", rejection_note: approve ? "" : s(f, "note") }).eq("id", s(f, "id"));
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/overview");
}

export async function resolveReport(f: FormData) {
  const sb = await supabaseServer();
  await sb.from("reports").update({ resolved: true }).eq("id", s(f, "id"));
  revalidatePath("/admin/overview");
}

export async function setUserActive(f: FormData) {
  const sb = await supabaseServer();
  await sb.from("profiles").update({ active: f.get("active") === "true" }).eq("id", s(f, "id"));
  revalidatePath("/admin/overview");
}
