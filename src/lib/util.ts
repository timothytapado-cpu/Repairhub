export const STATUS_LABEL: Record<string, string> = {
  new: "New request",
  received: "Received",
  in_progress: "In progress",
  ready: "Ready",
  done: "Done",
  cancelled: "Cancelled",
};

export const PLAN = {
  basic: { name: "Basic", price: 299, blurb: "Up to 2 technicians, 50 inventory items and 100 tickets a month." },
  pro: { name: "Pro", price: 799, blurb: "Unlimited technicians, items and tickets, plus priority listing in search." },
} as const;

/** Plan limits from the Figma "Plan usage" panel. */
export const PLAN_LIMITS = {
  basic: { technicians: 2, items: 50, tickets: 100 },
  pro: { technicians: Infinity, items: Infinity, tickets: Infinity },
} as const;

export const PRODUCT_CATEGORIES = [
  "Phone cases",
  "Screen protectors",
  "Chargers & cables",
  "Power banks",
  "Earphones & headsets",
  "Phones",
  "Screens & parts",
  "Batteries",
  "Other accessories",
] as const;

/** Great-circle distance in km (Haversine). */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const toMin = (h: string, m: string, ap: string) => (Number(h) % 12) * 60 + Number(m || 0) + (ap.toLowerCase() === "pm" ? 720 : 0);
const fmtMin = (t: number) => {
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

/** Reads hours text such as "Mon-Sat 9:00 AM - 7:00 PM" and says whether the shop is open right now. Null if the text can't be read. */
export function openStatus(hours: string | null | undefined, now = new Date()): { open: boolean; label: string } | null {
  if (!hours) return null;
  const t = hours.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!t) return null;
  const open = toMin(t[1], t[2], t[3]);
  const close = toMin(t[4], t[5], t[6]);
  let days = [0, 1, 2, 3, 4, 5, 6];
  const r = hours.toLowerCase().match(/(sun|mon|tue|wed|thu|fri|sat)\w*\s*(?:-|–|to)\s*(sun|mon|tue|wed|thu|fri|sat)/);
  if (r) {
    const a = DAY_KEYS.indexOf(r[1]);
    const b = DAY_KEYS.indexOf(r[2]);
    days = [];
    for (let d = a; ; d = (d + 1) % 7) {
      days.push(d);
      if (d === b) break;
    }
  }
  const mins = now.getHours() * 60 + now.getMinutes();
  const isOpen = days.includes(now.getDay()) && mins >= open && mins < close;
  return { open: isOpen, label: isOpen ? `Open now · closes ${fmtMin(close)}` : `Closed · opens ${fmtMin(open)}` };
}

export const fmtDistance = (km: number) => (km < 1 ? `${Math.round(km * 10) * 100} m` : `${km.toFixed(1)} km`);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
export const peso = (n: number) => "₱" + Number(n).toLocaleString("en-PH");
