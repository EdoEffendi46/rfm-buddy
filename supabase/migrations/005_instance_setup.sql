-- First-time instance setup (beli putus — WordPress-style owner wizard)
-- Run after 004_service_category_free_text.sql

create table if not exists public.instance_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default '',
  setup_completed_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.instance_settings (id) values (1) on conflict (id) do nothing;

-- Existing deployments with a linked owner are already set up
update public.instance_settings
set
  setup_completed_at = coalesce(setup_completed_at, now()),
  business_name = case when business_name = '' then 'ChatCRM' else business_name end
where id = 1
  and exists (
    select 1 from public.agents
    where role = 'owner' and auth_user_id is not null
  );

alter table public.instance_settings enable row level security;

drop policy if exists "demo_read_instance_settings" on public.instance_settings;
create policy "demo_read_instance_settings" on public.instance_settings
  for select using (true);

comment on table public.instance_settings is 'Singleton row (id=1). setup_completed_at null = show /setup wizard.';
