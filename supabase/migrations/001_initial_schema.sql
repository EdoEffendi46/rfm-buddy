-- ChatCRM initial schema (PostgreSQL / Supabase)
-- Run manually: Supabase Dashboard → SQL Editor → paste → Run
-- Or via Lovable chat after git sync

-- Extensions
create extension if not exists "pgcrypto";

-- Agents
create table if not exists public.agents (
  id text primary key,
  name text not null,
  role text not null check (role in ('cs', 'supervisor', 'owner')),
  initials text not null,
  color text not null,
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);

-- Services
create table if not exists public.services (
  id text primary key,
  name text not null,
  default_price numeric not null default 0,
  category text not null check (category in ('laundry', 'salon'))
);

-- Tags
create table if not exists public.tags (
  id text primary key,
  name text not null,
  color text not null,
  scope text not null check (scope in ('customer', 'conversation'))
);

-- Templates
create table if not exists public.templates (
  id text primary key,
  text text not null
);

-- Customers
create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null,
  join_date timestamptz not null,
  assigned_agent_id text references public.agents(id) on delete set null,
  tags text[] not null default '{}',
  notes text not null default '',
  order_status text not null default 'dalam_proses'
    check (order_status in ('dalam_proses', 'siap_diambil', 'selesai')),
  conversation_status text not null default 'open'
    check (conversation_status in ('open', 'resolved', 'snoozed')),
  priority text not null default 'normal'
    check (priority in ('high', 'normal', 'low')),
  snooze_until timestamptz,
  conversation_tags text[] not null default '{}',
  segment_history jsonb not null default '[]',
  cadence_override_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_assigned_agent on public.customers(assigned_agent_id);
create index if not exists idx_customers_conversation_status on public.customers(conversation_status);

-- Purchases (normalized from Customer.purchases[])
create table if not exists public.purchases (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  service_id text references public.services(id) on delete set null,
  service_name text not null,
  purchased_at timestamptz not null,
  price numeric not null,
  notes text
);

create index if not exists idx_purchases_customer on public.purchases(customer_id);

-- Messages
create table if not exists public.messages (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  content text not null,
  sent_at timestamptz not null,
  read_status text not null default 'sent'
    check (read_status in ('sent', 'delivered', 'read')),
  type text not null default 'text'
    check (type in ('text', 'internal_note'))
);

create index if not exists idx_messages_customer on public.messages(customer_id, sent_at desc);

-- Manual shares
create table if not exists public.manual_shares (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  shared_with_agent_id text not null references public.agents(id) on delete cascade,
  shared_by_agent_id text not null references public.agents(id) on delete cascade,
  permission text not null check (permission in ('view', 'edit')),
  reason text not null default '',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_manual_shares_customer on public.manual_shares(customer_id);
create index if not exists idx_manual_shares_agent on public.manual_shares(shared_with_agent_id);

-- Audit log
create table if not exists public.audit_log (
  id text primary key,
  logged_at timestamptz not null default now(),
  actor_id text not null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('cs', 'supervisor', 'owner')),
  action text not null,
  target_type text not null check (target_type in ('customer', 'agent', 'conversation', 'system')),
  target_id text not null,
  target_label text not null default '',
  old_value text,
  new_value text,
  details text
);

create index if not exists idx_audit_log_logged_at on public.audit_log(logged_at desc);

-- Export requests
create table if not exists public.export_requests (
  id text primary key,
  requested_by_agent_id text not null references public.agents(id) on delete cascade,
  data_type text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'completed')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_agent_id text references public.agents(id) on delete set null,
  resolution_note text
);

-- Field visibility rules
create table if not exists public.field_visibility_rules (
  id text primary key,
  field_name text not null,
  entity_type text not null default 'customer',
  hidden_for_roles text[] not null default '{}',
  mask_pattern text not null default 'full_hide',
  locked boolean not null default false
);

-- updated_at trigger for customers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- Demo: enable RLS later with policies per role. For initial seed/dev, allow service role only.
-- App should use server functions with service role or proper RLS policies.

alter table public.agents enable row level security;
alter table public.customers enable row level security;
alter table public.messages enable row level security;
alter table public.purchases enable row level security;
alter table public.manual_shares enable row level security;
alter table public.audit_log enable row level security;
alter table public.export_requests enable row level security;
alter table public.field_visibility_rules enable row level security;
alter table public.services enable row level security;
alter table public.templates enable row level security;
alter table public.tags enable row level security;

-- Permissive policies for demo (replace with role-based policies before production)
-- Requires Supabase Auth or custom JWT for real RBAC; demo uses server-side checks in app.

create policy "demo_read_all" on public.agents for select using (true);
create policy "demo_read_customers" on public.customers for select using (true);
create policy "demo_read_messages" on public.messages for select using (true);
create policy "demo_read_purchases" on public.purchases for select using (true);
create policy "demo_read_shares" on public.manual_shares for select using (true);
create policy "demo_read_audit" on public.audit_log for select using (true);
create policy "demo_read_exports" on public.export_requests for select using (true);
create policy "demo_read_field_rules" on public.field_visibility_rules for select using (true);
create policy "demo_read_services" on public.services for select using (true);
create policy "demo_read_templates" on public.templates for select using (true);
create policy "demo_read_tags" on public.tags for select using (true);

-- Writes via service role in server functions recommended; anon insert for demo only:
create policy "demo_write_customers" on public.customers for all using (true) with check (true);
create policy "demo_write_messages" on public.messages for all using (true) with check (true);
create policy "demo_write_agents" on public.agents for all using (true) with check (true);
create policy "demo_write_purchases" on public.purchases for all using (true) with check (true);
create policy "demo_write_shares" on public.manual_shares for all using (true) with check (true);
create policy "demo_write_audit" on public.audit_log for all using (true) with check (true);
create policy "demo_write_exports" on public.export_requests for all using (true) with check (true);
create policy "demo_write_field_rules" on public.field_visibility_rules for all using (true) with check (true);
create policy "demo_write_services" on public.services for all using (true) with check (true);
create policy "demo_write_templates" on public.templates for all using (true) with check (true);
create policy "demo_write_tags" on public.tags for all using (true) with check (true);
