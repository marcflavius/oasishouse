-- Participants table for Oasis House Caribbean casting subscriptions.
-- RLS is enabled with NO policies, so the anon key cannot read/write directly.
-- All access goes through Edge Functions using the service role key.

create extension if not exists pgcrypto;

create table if not exists public.participants (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null    default now(),
  prenom              text        not null,
  nom                 text        not null,
  email               text        not null    unique,
  telephone           text,
  age                 int         check (age is null or (age >= 18 and age <= 120)),
  ile                 text,
  motivation          text,
  verified            boolean     not null    default false,
  verified_at         timestamptz,
  verification_token  text        unique,
  token_expires_at    timestamptz
);

create index if not exists participants_created_at_idx
  on public.participants (created_at desc);

create index if not exists participants_verification_token_idx
  on public.participants (verification_token);

alter table public.participants enable row level security;
