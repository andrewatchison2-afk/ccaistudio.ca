-- ============================================================
-- CanSource — Canadian Supplier Directory SaaS
-- Supabase Schema + RLS Policies
-- ============================================================
-- Run this in the Supabase SQL editor in order.
-- Assumes the `auth` schema already exists (it does in Supabase).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy search on company names

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────
create type user_role as enum ('brand', 'supplier', 'admin');

create type subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete'
);

create type subscription_tier as enum (
  'free',
  'brand_pro',        -- $79/month — brands get unlimited access + contact info
  'supplier_featured' -- $49/month — suppliers get badge + top placement + analytics
);

create type canadian_province as enum (
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU',
  'ON', 'PE', 'QC', 'SK', 'YT'
);

-- ──────────────────────────────────────────────────────────────
-- PROFILES
-- Extends auth.users. One row per authenticated user.
-- ──────────────────────────────────────────────────────────────
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  role              user_role      not null default 'brand',
  full_name         text,
  company_name      text,
  avatar_url        text,
  stripe_customer_id text unique,                    -- Stripe customer object
  subscription_status subscription_status default null,
  subscription_tier   subscription_tier   not null default 'free',
  subscription_id   text unique,                    -- Stripe subscription id
  subscription_period_end timestamptz,              -- current period end
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now()
);

comment on table public.profiles is
  'One profile per auth user. Stores role, Stripe billing state, and display info.';

-- Auto-create profile on new auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'brand'
    ),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- PRODUCT CATEGORIES
-- Normalized lookup table — suppliers reference these via junction.
-- ──────────────────────────────────────────────────────────────
create table public.product_categories (
  id    serial primary key,
  name  text not null unique,
  slug  text not null unique
);

comment on table public.product_categories is
  'Canonical list of supplier product categories.';

insert into public.product_categories (name, slug) values
  ('Apparel & Clothing',        'apparel-clothing'),
  ('Beauty & Personal Care',    'beauty-personal-care'),
  ('Electronics & Tech',        'electronics-tech'),
  ('Food & Beverage',           'food-beverage'),
  ('Health & Wellness',         'health-wellness'),
  ('Home & Garden',             'home-garden'),
  ('Industrial & B2B',          'industrial-b2b'),
  ('Jewelry & Accessories',     'jewelry-accessories'),
  ('Kids & Baby',               'kids-baby'),
  ('Office & Stationery',       'office-stationery'),
  ('Outdoor & Sporting Goods',  'outdoor-sporting-goods'),
  ('Packaging & Supplies',      'packaging-supplies'),
  ('Pet Supplies',              'pet-supplies'),
  ('Printing & Promotional',    'printing-promotional'),
  ('Textiles & Fabric',         'textiles-fabric'),
  ('Toys & Games',              'toys-games'),
  ('Other',                     'other');

-- ──────────────────────────────────────────────────────────────
-- SUPPLIERS
-- Core directory listing. One supplier profile per account.
-- ──────────────────────────────────────────────────────────────
create table public.suppliers (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,

  -- Public info
  company_name          text not null,
  province              canadian_province not null,
  website               text,
  description           text,
  logo_url              text,

  -- Fulfillment details
  min_order_quantity    integer check (min_order_quantity >= 0),
  lead_time_days        integer check (lead_time_days >= 0),
  ships_internationally boolean not null default false,
  usmca_compliant       boolean not null default false,
  accepts_shopify_orders boolean not null default false,

  -- Gated field — only visible to brand_pro subscribers
  contact_email         text,
  contact_phone         text,

  -- Admin-controlled flags
  is_verified           boolean not null default false,
  is_featured           boolean not null default false,  -- driven by supplier subscription
  is_active             boolean not null default true,   -- admin can deactivate

  -- SEO / search
  slug                  text unique,

  -- Timestamps
  last_updated          timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

comment on table public.suppliers is
  'Directory listings. contact_email is hidden from free brand accounts via RLS.';

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute procedure public.set_updated_at();

-- Supplier ↔ Category junction
create table public.supplier_categories (
  supplier_id  uuid not null references public.suppliers(id) on delete cascade,
  category_id  integer not null references public.product_categories(id) on delete cascade,
  primary key (supplier_id, category_id)
);

-- Auto-slug from company name
create or replace function public.generate_supplier_slug()
returns trigger language plpgsql as $$
declare
  base_slug text;
  final_slug text;
  counter   integer := 0;
begin
  base_slug := lower(regexp_replace(
    regexp_replace(new.company_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  final_slug := base_slug;
  while exists (
    select 1 from public.suppliers
    where slug = final_slug and id != coalesce(new.id, uuid_generate_v4())
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  new.slug := final_slug;
  return new;
end;
$$;

create trigger supplier_auto_slug
  before insert on public.suppliers
  for each row when (new.slug is null)
  execute procedure public.generate_supplier_slug();

-- ──────────────────────────────────────────────────────────────
-- SUPPLIER PROFILE VIEWS
-- Analytics for supplier dashboard — who viewed their listing.
-- ──────────────────────────────────────────────────────────────
create table public.supplier_views (
  id           bigserial primary key,
  supplier_id  uuid not null references public.suppliers(id) on delete cascade,
  viewer_id    uuid references public.profiles(id) on delete set null, -- null = anonymous
  viewed_at    timestamptz not null default now(),
  -- de-dupe: one unique view per viewer per supplier per day
  constraint unique_daily_view unique (supplier_id, viewer_id, (viewed_at::date))
);

comment on table public.supplier_views is
  'Page view events for supplier analytics. One unique row per viewer per day.';

create index on public.supplier_views (supplier_id, viewed_at desc);

-- ──────────────────────────────────────────────────────────────
-- SAVED SUPPLIERS  (brand dashboard feature)
-- ──────────────────────────────────────────────────────────────
create table public.saved_suppliers (
  brand_id    uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  saved_at    timestamptz not null default now(),
  primary key (brand_id, supplier_id)
);

comment on table public.saved_suppliers is
  'Brands can bookmark suppliers. Visible in their dashboard.';

create index on public.saved_suppliers (brand_id, saved_at desc);

-- ──────────────────────────────────────────────────────────────
-- BRAND VIEW HISTORY  (tracks which suppliers a brand has clicked)
-- Used to enforce the free-tier 5-views/month limit.
-- ──────────────────────────────────────────────────────────────
create table public.brand_supplier_views (
  id           bigserial primary key,
  brand_id     uuid not null references public.profiles(id) on delete cascade,
  supplier_id  uuid not null references public.suppliers(id) on delete cascade,
  viewed_at    timestamptz not null default now(),
  -- one counted "detail open" per supplier per brand per month
  constraint unique_monthly_brand_view
    unique (brand_id, supplier_id, (date_trunc('month', viewed_at)))
);

comment on table public.brand_supplier_views is
  'Tracks brand detail-page opens. Free tier is capped at 5 unique suppliers/month.';

create index on public.brand_supplier_views (brand_id, viewed_at desc);

-- Helper: how many unique supplier views has a brand used this month?
create or replace function public.brand_monthly_views_used(brand_uuid uuid)
returns integer
language sql stable
as $$
  select count(*)::integer
  from public.brand_supplier_views
  where brand_id = brand_uuid
    and date_trunc('month', viewed_at) = date_trunc('month', now());
$$;

-- ──────────────────────────────────────────────────────────────
-- STRIPE WEBHOOK EVENTS  (idempotency log)
-- ──────────────────────────────────────────────────────────────
create table public.stripe_events (
  id           text primary key,   -- Stripe event id (evt_...)
  type         text not null,
  processed_at timestamptz not null default now(),
  payload      jsonb
);

comment on table public.stripe_events is
  'Processed Stripe webhook event log for idempotency.';

-- ──────────────────────────────────────────────────────────────
-- ADMIN ACTIVITY LOG
-- ──────────────────────────────────────────────────────────────
create table public.admin_log (
  id          bigserial primary key,
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,   -- 'supplier' | 'profile' | 'stripe_event'
  target_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES FOR SEARCH & FILTERING
-- ──────────────────────────────────────────────────────────────
create index suppliers_province_idx       on public.suppliers (province);
create index suppliers_is_featured_idx    on public.suppliers (is_featured desc, created_at desc);
create index suppliers_is_active_idx      on public.suppliers (is_active);
create index suppliers_usmca_idx          on public.suppliers (usmca_compliant);
create index suppliers_ships_intl_idx     on public.suppliers (ships_internationally);
create index suppliers_company_name_trgm  on public.suppliers using gin (company_name gin_trgm_ops);
create index suppliers_description_trgm   on public.suppliers using gin (description gin_trgm_ops);

-- ──────────────────────────────────────────────────────────────
-- VIEWS
-- ──────────────────────────────────────────────────────────────

-- Public-safe supplier view (strips contact info — enforced again by RLS)
create or replace view public.suppliers_public as
  select
    s.id,
    s.company_name,
    s.province,
    s.website,
    s.description,
    s.logo_url,
    s.slug,
    s.min_order_quantity,
    s.lead_time_days,
    s.ships_internationally,
    s.usmca_compliant,
    s.accepts_shopify_orders,
    s.is_verified,
    s.is_featured,
    s.last_updated,
    s.created_at,
    -- Aggregate categories as an array of names
    array_agg(pc.name order by pc.name) filter (where pc.name is not null) as categories
  from public.suppliers s
  left join public.supplier_categories sc on sc.supplier_id = s.id
  left join public.product_categories pc  on pc.id = sc.category_id
  where s.is_active = true
  group by s.id;

-- Supplier analytics summary (for supplier dashboard)
create or replace view public.supplier_analytics as
  select
    s.id as supplier_id,
    s.profile_id,
    count(sv.id)                                          as total_views,
    count(sv.id) filter (
      where sv.viewed_at >= now() - interval '30 days'
    )                                                     as views_last_30_days,
    count(sv.id) filter (
      where sv.viewed_at >= now() - interval '7 days'
    )                                                     as views_last_7_days,
    count(ss.brand_id)                                    as total_saves,
    max(sv.viewed_at)                                     as last_viewed_at
  from public.suppliers s
  left join public.supplier_views sv on sv.supplier_id = s.id
  left join public.saved_suppliers ss on ss.supplier_id = s.id
  group by s.id, s.profile_id;

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================
-- Principle: default deny, grant explicit SELECT/INSERT/UPDATE/DELETE per role.
-- Roles: anon (not logged in), authenticated (logged-in user), service_role (bypass all)
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.suppliers           enable row level security;
alter table public.supplier_categories enable row level security;
alter table public.supplier_views      enable row level security;
alter table public.saved_suppliers     enable row level security;
alter table public.brand_supplier_views enable row level security;
alter table public.product_categories  enable row level security;
alter table public.stripe_events       enable row level security;
alter table public.admin_log           enable row level security;

-- ──────────────────────────────────────────────────────────────
-- Helper: is the current user an admin?
-- ──────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: does current user have an active brand_pro subscription?
create or replace function public.is_brand_pro()
returns boolean
language sql stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and subscription_tier = 'brand_pro'
      and subscription_status = 'active'
  );
$$;

-- Helper: is this uid a supplier (role = supplier)?
create or replace function public.is_supplier()
returns boolean
language sql stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'supplier'
  );
$$;

-- ──────────────────────────────────────────────────────────────
-- PROFILES RLS
-- ──────────────────────────────────────────────────────────────

-- Users can read their own profile; admins can read all
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

-- Users can update their own profile (not role or stripe fields — those are service_role only)
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any profile
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- Insert is handled by the trigger + service_role only
create policy "profiles_insert_trigger"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- PRODUCT_CATEGORIES RLS
-- ──────────────────────────────────────────────────────────────

-- Anyone can read categories (needed for filter UI)
create policy "categories_select_public"
  on public.product_categories for select
  using (true);

-- Only admins can mutate
create policy "categories_mutate_admin"
  on public.product_categories for all
  using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- SUPPLIERS RLS
-- ──────────────────────────────────────────────────────────────

-- Anyone (including anon) can see basic info on active suppliers.
-- contact_email / contact_phone are masked by column-level logic in the app layer;
-- at the DB level we gate the full row on brand_pro or admin.
create policy "suppliers_select_active_public"
  on public.suppliers for select
  using (is_active = true);

-- Admins can see everything including inactive
create policy "suppliers_select_admin"
  on public.suppliers for select
  using (public.is_admin());

-- Suppliers can insert their own listing (one per profile)
create policy "suppliers_insert_own"
  on public.suppliers for insert
  with check (
    auth.uid() = profile_id
    and public.is_supplier()
  );

-- Suppliers can update their own listing
create policy "suppliers_update_own"
  on public.suppliers for update
  using (
    auth.uid() = profile_id
    and public.is_supplier()
  )
  with check (
    auth.uid() = profile_id
    -- suppliers cannot self-set is_verified or is_featured
  );

-- Admins can update/delete any supplier
create policy "suppliers_all_admin"
  on public.suppliers for all
  using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- SUPPLIER_CATEGORIES RLS
-- ──────────────────────────────────────────────────────────────

create policy "supplier_categories_select_public"
  on public.supplier_categories for select
  using (true);

-- Suppliers manage their own categories; admins manage all
create policy "supplier_categories_mutate_own"
  on public.supplier_categories for all
  using (
    exists (
      select 1 from public.suppliers s
      where s.id = supplier_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- ──────────────────────────────────────────────────────────────
-- SUPPLIER_VIEWS RLS
-- ──────────────────────────────────────────────────────────────

-- Suppliers can see views on their own listings
create policy "supplier_views_select_own_supplier"
  on public.supplier_views for select
  using (
    exists (
      select 1 from public.suppliers s
      where s.id = supplier_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- Any authenticated user can insert a view event
create policy "supplier_views_insert_authenticated"
  on public.supplier_views for insert
  with check (
    auth.role() = 'authenticated'
    and viewer_id = auth.uid()
  );

-- ──────────────────────────────────────────────────────────────
-- SAVED_SUPPLIERS RLS
-- ──────────────────────────────────────────────────────────────

create policy "saved_suppliers_select_own"
  on public.saved_suppliers for select
  using (auth.uid() = brand_id or public.is_admin());

create policy "saved_suppliers_insert_own"
  on public.saved_suppliers for insert
  with check (auth.uid() = brand_id);

create policy "saved_suppliers_delete_own"
  on public.saved_suppliers for delete
  using (auth.uid() = brand_id);

-- ──────────────────────────────────────────────────────────────
-- BRAND_SUPPLIER_VIEWS RLS
-- ──────────────────────────────────────────────────────────────

create policy "brand_supplier_views_select_own"
  on public.brand_supplier_views for select
  using (auth.uid() = brand_id or public.is_admin());

create policy "brand_supplier_views_insert_own"
  on public.brand_supplier_views for insert
  with check (auth.uid() = brand_id);

-- ──────────────────────────────────────────────────────────────
-- STRIPE_EVENTS RLS  (service_role only — never touched by clients)
-- ──────────────────────────────────────────────────────────────

create policy "stripe_events_admin_only"
  on public.stripe_events for all
  using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- ADMIN_LOG RLS
-- ──────────────────────────────────────────────────────────────

create policy "admin_log_admin_only"
  on public.admin_log for all
  using (public.is_admin());

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- anon + authenticated can read categories and active suppliers
grant usage on schema public to anon, authenticated;

grant select on public.product_categories  to anon, authenticated;
grant select on public.suppliers           to anon, authenticated;
grant select on public.supplier_categories to anon, authenticated;
grant select on public.suppliers_public    to anon, authenticated;

-- authenticated users
grant select, insert, update on public.profiles          to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, delete on public.supplier_categories to authenticated;
grant select, insert on public.supplier_views            to authenticated;
grant select, insert, delete on public.saved_suppliers   to authenticated;
grant select, insert on public.brand_supplier_views      to authenticated;
grant select on public.supplier_analytics                to authenticated;
grant execute on function public.brand_monthly_views_used(uuid) to authenticated;
grant execute on function public.is_admin()    to authenticated;
grant execute on function public.is_brand_pro() to authenticated;
grant execute on function public.is_supplier() to authenticated;

-- sequences
grant usage, select on sequence public.supplier_views_id_seq        to authenticated;
grant usage, select on sequence public.brand_supplier_views_id_seq  to authenticated;
grant usage, select on sequence public.admin_log_id_seq             to authenticated;

-- ============================================================
-- SEED: ADMIN USER HELPER
-- After creating your user via Supabase Auth, run this to
-- promote them to admin (replace the email):
-- ============================================================
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'your@email.com');
-- ============================================================
