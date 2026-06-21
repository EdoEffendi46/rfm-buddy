-- Invitation resend cooldown + keep pending until accept-invite completes

alter table public.agents
  add column if not exists invitation_sent_at timestamptz;

-- Do not auto-activate on auth user create; completeInviteServerFn sets active after profile setup
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
        email = new.email
    where id = meta_agent_id;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
