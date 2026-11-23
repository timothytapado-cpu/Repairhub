import { supabaseServer } from "./supabase/server";
import type { FinderShop } from "@/components/use-finder";

export async function loadFinderShops(): Promise<FinderShop[]> {
  const sb = await supabaseServer();
  const { data: shops } = await sb
    .from("shops")
    .select("id,name,address,barangay,lat,lng,plan,phone,hours,status,shop_services(name,price_from),reviews(rating,comment,created_at)"); // every shop is public; only the Verified badge depends on documents
  return (shops ?? []).map((s: any) => {
    const reviews: any[] = [...(s.reviews ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const r = reviews.map((x) => x.rating as number);
    const services = (s.shop_services ?? []).map((x: any) => ({ name: x.name as string, price: Number(x.price_from) }));
    const latest = reviews.find((x) => x.comment);
    return {
      id: s.id,
      name: s.name,
      address: s.address,
      barangay: s.barangay,
      lat: s.lat,
      lng: s.lng,
      plan: s.plan,
      verified: s.status === "approved",
      phone: s.phone ?? "",
      hours: s.hours ?? "",
      rating: r.length ? r.reduce((a, b) => a + b, 0) / r.length : null,
      reviews: r.length,
      services,
      minPrice: services.length ? Math.min(...services.map((x: { price: number }) => x.price)) : null,
      latestReview: latest ? { comment: latest.comment as string, rating: latest.rating as number } : null,
    };
  });
}
