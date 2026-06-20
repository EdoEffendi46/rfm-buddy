-- ChatCRM Auth: link Supabase Auth users to agents
-- Run after 001_initial_schema.sql in Supabase SQL Editor

alter table public.agents
  add column if not exists email text unique,
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_agents_auth_user_id on public.agents(auth_user_id);

-- Link new auth.users to agents (seed via metadata.agent_id, or create CS agent on register)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_agent_id text;
  new_agent_id text;
begin
  meta_agent_id := new.raw_user_meta_data->>'agent_id';

  if meta_agent_id is not null then
    update public.agents
    set auth_user_id = new.id,
        email = new.email
    where id = meta_agent_id;
    return new;
  end if;

  new_agent_id := 'ag-' || substr(replace(new.id::text, '-', ''), 1, 12);

  insert into public.agents (
    id, name, role, initials, color, is_online, email, auth_user_id
  ) values (
    new_agent_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'cs'),
    upper(substr(coalesce(new.raw_user_meta_data->>'name', 'U'), 1, 2)),
    coalesce(new.raw_user_meta_data->>'color', '#0EA5E9'),
    false,
    new.email,
    new.id
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Authenticated users can read their own agent profile
create policy "agents_read_own" on public.agents
  for select using (auth_user_id = auth.uid());
