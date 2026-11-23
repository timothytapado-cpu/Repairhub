-- Mobile RepairHub schema. Run this whole file in Supabase > SQL Editor.
create extension if not exists "pgcrypto";

create type user_role as enum ('customer','owner','technician','admin');
create type shop_status as enum ('pending','approved','rejected');
create type plan_type as enum ('basic','pro');
create type ticket_status as enum ('new','received','in_progress','ready','done','cancelled');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text default '',
  role user_role not null default 'customer',
  shop_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text default '',
  address text not null,
  barangay text default '',
  lat double precision,
  lng double precision,
  phone text default '',
  email text not null default '',
  hours text default 'Mon-Sat 9:00 AM - 6:00 PM',
  plan plan_type not null default 'basic',
  plan_paid_until date,
  status shop_status not null default 'pending',
  rejection_note text default '',
  permit_url text default '',
  created_at timestamptz not null default now()
);
alter table profiles add constraint profiles_shop_fk foreign key (shop_id) references shops(id) on delete set null;

create table shop_services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  price_from numeric(10,2) not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  category text default 'Parts',
  sku text default '',
  qty integer not null default 0,
  low_threshold integer not null default 3,
  price numeric(10,2) not null default 0,
  for_sale boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence ticket_seq start 10001;
create table tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('MRS-' || nextval('ticket_seq')),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid references profiles(id) on delete set null,
  customer_name text default '',
  technician_id uuid references profiles(id) on delete set null,
  device text not null,
  issue text not null,
  details text default '',
  status ticket_status not null default 'new',
  estimate_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  kind text not null,         -- status | note | message | assign
  body text not null default '',
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now(),
  unique (shop_id, customer_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  shop_id uuid references shops(id) on delete set null,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- helpers --------------------------------------------------------------
create or replace function my_role() returns user_role language sql stable security definer set search_path=public as
$$ select role from profiles where id = auth.uid() $$;
create or replace function my_shop() returns uuid language sql stable security definer set search_path=public as
$$ select shop_id from profiles where id = auth.uid() $$;

-- new auth user -> profile (customer or owner only; admin is set manually)
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare r user_role := 'customer';
begin
  if (new.raw_user_meta_data->>'role') in ('owner','technician') then
    r := (new.raw_user_meta_data->>'role')::user_role;
  end if;
  insert into profiles (id, full_name, phone, role, shop_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''), r,
          nullif(new.raw_user_meta_data->>'shop_id','')::uuid);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- when a shop is created, attach it to its owner
create or replace function attach_shop_to_owner() returns trigger language plpgsql security definer set search_path=public as $$
begin update profiles set shop_id = new.id where id = new.owner_id; return new; end $$;
create trigger on_shop_created after insert on shops for each row execute function attach_shop_to_owner();

-- ticket housekeeping
create or replace function touch_ticket() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger tickets_touch before update on tickets for each row execute function touch_ticket();

-- notify customer when ticket status changes
create or replace function notify_ticket_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status is distinct from old.status and new.customer_id is not null then
    insert into notifications(user_id, body)
    values (new.customer_id, 'Your repair ' || new.code || ' (' || new.device || ') is now: ' || replace(new.status::text,'_',' '));
  end if;
  return new;
end $$;
create trigger tickets_notify after update on tickets for each row execute function notify_ticket_change();

-- Row Level Security ----------------------------------------------------
alter table profiles enable row level security;
alter table shops enable row level security;
alter table shop_services enable row level security;
alter table products enable row level security;
alter table tickets enable row level security;
alter table ticket_events enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

-- profiles
create policy "read own or shop or admin" on profiles for select using (
  id = auth.uid() or my_role() = 'admin' or (shop_id is not null and shop_id = my_shop())
);
create policy "customer reads their technician" on profiles for select using (
  exists (select 1 from tickets t where t.technician_id = profiles.id and t.customer_id = auth.uid())
);
create policy "update own" on profiles for update using (id = auth.uid() or my_role() = 'admin');
create policy "owner updates staff" on profiles for update using (my_role()='owner' and shop_id = my_shop());

-- shops: public can see approved ones
-- Every shop is public. Documents only decide the Verified badge (status = 'approved'); a declined shop stays visible.
create policy "public shops" on shops for select using (true);
create policy "owner creates shop" on shops for insert with check (owner_id = auth.uid());
create policy "owner updates shop" on shops for update using (owner_id = auth.uid() or my_role() = 'admin');

create policy "services public" on shop_services for select using (true);
create policy "services owner write" on shop_services for all using (shop_id = my_shop() and my_role()='owner') with check (shop_id = my_shop() and my_role()='owner');

create policy "products public sale" on products for select using (for_sale or shop_id = my_shop());
create policy "products owner write" on products for all using (shop_id = my_shop() and my_role() in ('owner')) with check (shop_id = my_shop() and my_role() in ('owner'));

-- tickets
create policy "tickets visible" on tickets for select using (
  customer_id = auth.uid() or shop_id = my_shop() or my_role()='admin'
);
create policy "customer creates ticket" on tickets for insert with check (customer_id = auth.uid() or (shop_id = my_shop() and my_role()='owner'));
create policy "shop staff update tickets" on tickets for update using (shop_id = my_shop() and my_role() in ('owner','technician'));
create policy "customer cancels own" on tickets for update using (customer_id = auth.uid());

create policy "events visible" on ticket_events for select using (
  exists (select 1 from tickets t where t.id = ticket_id and (t.customer_id = auth.uid() or t.shop_id = my_shop()))
);
create policy "events insert" on ticket_events for insert with check (
  exists (select 1 from tickets t where t.id = ticket_id and (t.customer_id = auth.uid() or t.shop_id = my_shop()))
);

create policy "reviews public" on reviews for select using (true);
create policy "reviews own insert" on reviews for insert with check (customer_id = auth.uid());

create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update using (user_id = auth.uid());

create policy "reports insert" on reports for insert with check (reporter_id = auth.uid());
create policy "reports admin read" on reports for select using (my_role()='admin' or reporter_id = auth.uid());
create policy "reports admin update" on reports for update using (my_role()='admin');

-- Storage bucket for verification documents (private)
insert into storage.buckets (id, name, public) values ('permits','permits', false) on conflict do nothing;
create policy "owner uploads permit" on storage.objects for insert to authenticated with check (bucket_id='permits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner/admin reads permit" on storage.objects for select to authenticated using (bucket_id='permits' and ((storage.foldername(name))[1] = auth.uid()::text or my_role()='admin'));

-- Guards against privilege escalation ------------------------------------
create or replace function guard_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if coalesce(my_role()::text,'') <> 'admin' and auth.uid() is not null then
    new.role := old.role;
    if my_role() <> 'owner' then new.shop_id := old.shop_id; new.active := old.active; end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_profile();

create or replace function guard_shop() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and coalesce(my_role()::text,'') <> 'admin' then
    -- an owner may resubmit a rejected shop (rejected -> pending); every other status change is admin-only
    if not (old.status = 'rejected' and new.status = 'pending') then new.status := old.status; end if;
    new.rejection_note := old.rejection_note; new.owner_id := old.owner_id;
  end if;
  return new;
end $$;
create trigger shops_guard before update on shops for each row execute function guard_shop();

create or replace function guard_ticket() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and my_role() = 'customer' then
    if new.status <> 'cancelled' then new.status := old.status; end if;
    new.shop_id := old.shop_id; new.technician_id := old.technician_id; new.code := old.code; new.customer_id := old.customer_id;
  end if;
  return new;
end $$;
create trigger tickets_guard before update on tickets for each row execute function guard_ticket();

-- Product photos and descriptions (public bucket, owners write to their own shop folder)
alter table products add column if not exists image_url text default '';
alter table products add column if not exists description text default '';
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
create policy "owner uploads product image" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = my_shop()::text and my_role() = 'owner');
create policy "owner updates product image" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = my_shop()::text and my_role() = 'owner');
create policy "owner deletes product image" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = my_shop()::text and my_role() = 'owner');

-- Walk-in customers: tickets logged by shop staff for people without an account
alter table tickets add column if not exists customer_phone text not null default '';
alter table tickets add column if not exists source text not null default 'online';   -- 'online' | 'walk_in'
drop policy if exists "customer creates ticket" on tickets;
create policy "customer or staff creates ticket" on tickets for insert with check (
  customer_id = auth.uid() or (shop_id = my_shop() and my_role() in ('owner','technician'))
);

-- Before/after repair photos
create table if not exists ticket_photos (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  kind text not null check (kind in ('before','after')),
  path text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ticket_photos_ticket on ticket_photos(ticket_id, kind);
alter table ticket_photos enable row level security;
create policy "photos visible with ticket" on ticket_photos for select using (
  exists (select 1 from tickets t where t.id = ticket_id and (t.customer_id = auth.uid() or t.shop_id = my_shop()))
);
create policy "staff add photos" on ticket_photos for insert with check (
  my_role() in ('owner','technician') and exists (select 1 from tickets t where t.id = ticket_id and t.shop_id = my_shop())
);
create policy "staff replace photos" on ticket_photos for delete using (
  my_role() in ('owner','technician') and exists (select 1 from tickets t where t.id = ticket_id and t.shop_id = my_shop())
);
-- Private bucket: shop staff and the ticket's own customer can read; only shop staff can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-photos','repair-photos', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
create policy "staff upload repair photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = my_shop()::text and my_role() in ('owner','technician'));
create policy "staff delete repair photos" on storage.objects for delete to authenticated
  using (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = my_shop()::text and my_role() in ('owner','technician'));
create policy "staff and customer read repair photos" on storage.objects for select to authenticated
  using (bucket_id = 'repair-photos' and (
    (storage.foldername(name))[1] = my_shop()::text
    or exists (select 1 from tickets t where t.id::text = (storage.foldername(name))[2] and t.customer_id = auth.uid())
  ));
-- A repair cannot start without a before photo, or be marked ready without an after photo.
create or replace function require_repair_photos() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'in_progress' and old.status is distinct from 'in_progress'
     and not exists (select 1 from ticket_photos where ticket_id = new.id and kind = 'before') then
    raise exception 'Upload the before photo (the phone opened up) before starting the repair.';
  end if;
  if new.status = 'ready' and old.status is distinct from 'ready'
     and not exists (select 1 from ticket_photos where ticket_id = new.id and kind = 'after') then
    raise exception 'Upload the after photo before marking the repair ready.';
  end if;
  return new;
end $$;
create trigger tickets_photos before update on tickets for each row execute function require_repair_photos();
revoke execute on function require_repair_photos() from public, anon, authenticated;

-- Basic plan: at most 100 tickets a month per shop (Figma "Plan usage")
create or replace function check_ticket_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare p plan_type; n int;
begin
  select plan into p from shops where id = new.shop_id;
  if p = 'basic' then
    select count(*) into n from tickets where shop_id = new.shop_id and created_at >= date_trunc('month', now());
    if n >= 100 then raise exception 'This shop has reached its monthly request limit. Please try another shop or come back next month.'; end if;
  end if;
  return new;
end $$;
create trigger tickets_limit before insert on tickets for each row execute function check_ticket_limit();
revoke execute on function check_ticket_limit() from public, anon, authenticated;

-- Trigger-only functions should not be callable through the public API
revoke execute on function attach_shop_to_owner(), guard_profile(), guard_shop(), guard_ticket(), handle_new_user(), notify_ticket_change() from public, anon, authenticated;
alter function touch_ticket() set search_path = public;
-- (my_role() and my_shop() stay executable: the RLS policies call them.)

-- To make an administrator, sign up normally, then run:
--   update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
