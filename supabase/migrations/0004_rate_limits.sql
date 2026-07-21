-- Lightweight per-IP rate limiting for Edge Functions.
-- Callers use the bump_rate_limit RPC via the service role client.
-- Table has RLS enabled with no policies, so anon/authenticated cannot touch it.

create table if not exists public.rate_limits (
  bucket        text        not null,
  window_start  timestamptz not null,
  count         int         not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- Increments the counter for (bucket, window_start), inserting if missing,
-- and returns the new count. Piggy-backs a lazy cleanup of rows older than
-- one hour so the table stays trim without a cron job.
create or replace function public.bump_rate_limit(
  p_bucket text,
  p_window timestamptz
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  delete from public.rate_limits
    where window_start < now() - interval '1 hour';

  insert into public.rate_limits as rl (bucket, window_start, count)
  values (p_bucket, p_window, 1)
  on conflict (bucket, window_start)
    do update set count = rl.count + 1
  returning rl.count into new_count;

  return new_count;
end;
$$;

revoke all on function public.bump_rate_limit(text, timestamptz) from public;
grant execute on function public.bump_rate_limit(text, timestamptz) to service_role;
