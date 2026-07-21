-- Add "blaze" (nickname / stage name) — optional.
alter table public.participants
  add column if not exists blaze text;
