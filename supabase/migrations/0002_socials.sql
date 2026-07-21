-- Replace the "ile" text field with a "socials" jsonb array holding
-- { platform, url } objects. The list of allowed platforms is enforced
-- in the subscribe edge function, not in the DB.

alter table public.participants
  drop column if exists ile;

alter table public.participants
  add column if not exists socials jsonb not null default '[]'::jsonb;
