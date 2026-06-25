-- WhatsApp Business Cloud API integration
-- Run after 007_api_grants.sql

alter table public.messages
  add column if not exists wa_message_id text,
  add column if not exists channel text not null default 'internal'
    check (channel in ('internal', 'whatsapp'));

create unique index if not exists idx_messages_wa_message_id
  on public.messages (wa_message_id)
  where wa_message_id is not null;

alter table public.customers
  add column if not exists wa_id text;

create index if not exists idx_customers_wa_id on public.customers (wa_id);
create index if not exists idx_customers_phone on public.customers (phone);

alter table public.instance_settings
  add column if not exists whatsapp_connected_at timestamptz,
  add column if not exists whatsapp_phone_display text;

comment on column public.messages.wa_message_id is 'Meta Cloud API message id (wamid...)';
comment on column public.messages.channel is 'internal = inbox-only; whatsapp = synced with Meta';
comment on column public.customers.wa_id is 'Normalized WhatsApp id (E.164 digits, e.g. 62812...)';
