-- Allow any service category label (multi-vertical businesses)
alter table public.services drop constraint if exists services_category_check;

comment on column public.services.category is 'Free-text grouping for services (e.g. Perawatan, Membership). Owner-defined per business.';
