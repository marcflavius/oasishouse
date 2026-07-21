// Postgres-backed per-IP rate limiter. See migration 0004_rate_limits.sql.
// Fails open on DB errors — a rate-limit outage should not block real users.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  ip: string;
}

// Prefer Cloudflare / real-IP headers, fall back to XFF's leftmost entry.
// Anything unresolvable pools into a single "unknown" bucket — safe default.
export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  action: string,
  max: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const windowMs = windowMinutes * 60_000;
  const windowStart = new Date(
    Math.floor(Date.now() / windowMs) * windowMs
  ).toISOString();

  const { data, error } = await supabase.rpc("bump_rate_limit", {
    p_bucket: `${action}:${ip}`,
    p_window: windowStart,
  });

  if (error) {
    console.warn("rate limit RPC failed, failing open:", error.message);
    return { allowed: true, count: 0, ip };
  }

  const count = typeof data === "number" ? data : 0;
  return { allowed: count <= max, count, ip };
}
