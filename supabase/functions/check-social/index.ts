// POST /functions/v1/check-social
// Body: { url: string }
// Returns: { ok: true, exists: boolean, status: number, unknown?: true }
//
// Best-effort existence check for a social profile URL. Runs server-side so
// CORS isn't an issue. Some platforms (Instagram, TikTok, Facebook) always
// return 200 even for missing profiles — this function catches genuine 404s
// but can't detect soft-404 pages. Client should treat `unknown: true` as
// "accept, we couldn't verify."

import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const ALLOWED_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "m.tiktok.com",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.com",
  "fb.me",
  "twitch.tv",
  "www.twitch.tv",
  "snapchat.com",
  "www.snapchat.com",
]);

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  if (typeof url !== "string" || url.length > 500) {
    return jsonResponse({ error: "URL invalide." }, 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return jsonResponse({ error: "URL invalide." }, 400);
  }

  // SSRF guard — only allow whitelisted social hosts.
  if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    return jsonResponse({ error: "Domaine non autorisé." }, 400);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return jsonResponse({ error: "Protocole non autorisé." }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        // Some platforms serve blank/redirect pages to bot UAs — a browser-like
        // UA gives us a truer status on the actual profile page.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonResponse({
      ok: true,
      exists: res.status !== 404 && res.status !== 410,
      status: res.status,
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("check-social fetch error", err);
    // Network/timeout — fail-open so a flaky check doesn't block a valid handle.
    return jsonResponse({ ok: true, exists: true, status: 0, unknown: true });
  }
});
