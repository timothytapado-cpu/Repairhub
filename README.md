# Mobile RepairHub

Web and mobile (responsive) subscription-based platform for phone repair shop discovery and management.
Built from the Figma design with Next.js 15, Supabase (Postgres, Auth, Storage) and Leaflet/OpenStreetMap.

## Roles
| Role | Entry | Can do |
|---|---|---|
| Customer | `/register`, `/login` | Find shops by location, view profile, request repair, track status, message shop, review, report |
| Shop owner | `/register/shop`, `/login` | Register shop (live right away) + Basic/Pro plan (simulated payment), submit permit for the Verified badge, ticket board, inventory, employees, profile, subscription |
| Technician | `/login` (account made by owner) | Take new requests, update status, message customer |
| Admin | `/admin-login` (private, no sign-up) | Give the Verified badge (only after the shop submitted its permit) or reject and hide a shop, view permits, resolve reports, suspend users |

## Setup
1. Create a free project at https://supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql`.
3. Authentication > Providers > Email: turn **off** "Confirm email" (for easy demo sign-up).
4. Copy `.env.local.example` to `.env.local` and fill in the three keys (Project Settings > API).
5. `npm install` then `npm run dev`, open http://localhost:3000.
6. Make an admin: sign up as a customer, then in the SQL Editor run
   `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
   and sign in at `/admin-login`.

## Design
The UI follows the Figma file (design tokens, Manrope font, layouts). Colours live in `tailwind.config.js` and the shared button/card/chip classes in `src/app/globals.css`.
Plan rules follow the Figma "Plan usage" panel: Basic = 2 technicians, 50 inventory items, 100 tickets a month; Pro = unlimited.

## Shop listing rules
- A shop is public as soon as it registers with a **name, a map location, a contact number and an email**. Nothing else is needed to be found by customers.
- Documents only decide the **Verified badge**. An admin can give the badge (only if a permit was submitted) or decline it; a declined shop stays live without the badge and can resubmit.

## Demo flow
1. Register a shop (pin the location on the map) -> sign in as admin -> approve it.
2. Owner: add a technician under Employees. Switch to Pro under Subscription to unlock Inventory.
3. Register a customer, open the shop from the map, send a repair request.
4. Technician takes the job and moves it along; the customer sees the tracker and notifications update.

## Notes
- Payments are simulated (`changePlan` / `signUpShop` in `src/app/actions.ts`). Plug in PayMongo/GCash there.
- Nearby search uses the browser's geolocation plus the Haversine formula (`src/lib/util.ts`).
- Map services are free and need no API key (`src/lib/geo.ts`): OpenStreetMap tiles via Leaflet, Nominatim for address search (shop registration pin, "near a place" search on the home page) and the OSRM demo server for driving routes on a shop page. Nominatim allows about 1 request per second, so searches run on button press, not while typing. For heavy production use, switch to a paid or self-hosted provider.
- Security: Row Level Security policies and guard triggers are in `schema.sql`; the service-role key is only used server-side to create technician accounts and sign permit links.
