-- MVP 1: invitation-only onboarding (beli putus — no public self-register)
-- Run after 002_auth.sql

alter table public.agents
  add column if not exists invitation_status text not null default 'active'
    check (invitation_status in ('pending', 'active'));

update public.agents
set invitation_status = 'active'
where auth_user_id is not null;

-- Invited rows may exist before auth user accepts
update public.agents
set invitation_status = 'pending'
where auth_user_id is null and email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_agent_id text;
begin
  meta_agent_id := new.raw_user_meta_data->>'agent_id';

  if meta_agent_id is not null then
    update public.agents
    set auth_user_id = new.id,
        email = new.email,
        invitation_status = 'active'
    where id = meta_agent_id;
    return new;
  end if;

  -- MVP1: no public signup — users without agent_id metadata are not provisioned
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
