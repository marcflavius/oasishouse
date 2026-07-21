// Shared config for social platforms — imported by both the SocialsPicker UI
// and its tests. Keep in sync with the server-side allow-list in
// supabase/functions/_shared/validation.ts.

export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "facebook"
  | "twitch"
  | "snapchat";

export interface PlatformDef {
  key: Platform;
  label: string;
  color: string;
  // Static prefix shown before the input field (e.g. "instagram.com/").
  urlPrefix: string;
  // Placeholder for the handle input (e.g. "tonpseudo").
  usernameHint: string;
  // Regex the cleaned handle must match.
  usernamePattern: RegExp;
  // Full-URL regex — used to validate URLs (e.g. those pasted directly or
  // returned from server). Applied AFTER auto-prefixing https:// if missing.
  pattern: RegExp;
  // Builds the canonical URL for a valid username.
  buildUrl: (username: string) => string;
  // When true, the icon asset is a complete circular logo (bg + glyph baked in)
  // and should fill its container instead of being placed on a brand-colored disc.
  prerendered?: boolean;
}

export const PLATFORMS: PlatformDef[] = [
  {
    key: "instagram", label: "Instagram", color: "#E4405F",
    urlPrefix: "instagram.com/", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9._]{1,30}$/,
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?/i,
    buildUrl: (u) => `https://instagram.com/${u}`,
  },
  {
    key: "tiktok", label: "TikTok", color: "#000000", prerendered: true,
    urlPrefix: "tiktok.com/@", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9._]{2,24}$/,
    pattern: /^https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/(@?[A-Za-z0-9._-]+)\/?/i,
    buildUrl: (u) => `https://tiktok.com/@${u}`,
  },
  {
    key: "youtube", label: "YouTube", color: "#FF0000",
    urlPrefix: "youtube.com/@", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9._-]{3,30}$/,
    pattern: /^https?:\/\/(www\.|m\.)?(youtube\.com\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+|user\/[A-Za-z0-9._-]+)|youtu\.be\/[A-Za-z0-9_-]+)\/?/i,
    buildUrl: (u) => `https://youtube.com/@${u}`,
  },
  {
    key: "twitter", label: "X", color: "#0f172a",
    urlPrefix: "x.com/", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9_]{1,15}$/,
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}\/?/i,
    buildUrl: (u) => `https://x.com/${u}`,
  },
  {
    key: "facebook", label: "Facebook", color: "#1877F2",
    urlPrefix: "facebook.com/", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9.]{5,50}$/,
    pattern: /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9.\-_/]+\/?/i,
    buildUrl: (u) => `https://facebook.com/${u}`,
  },
  {
    key: "twitch", label: "Twitch", color: "#9146FF",
    urlPrefix: "twitch.tv/", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9_]{4,25}$/,
    pattern: /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]+\/?/i,
    buildUrl: (u) => `https://twitch.tv/${u}`,
  },
  {
    key: "snapchat", label: "Snapchat", color: "#FFCC00",
    urlPrefix: "snapchat.com/add/", usernameHint: "tonpseudo",
    usernamePattern: /^[A-Za-z0-9._-]{3,30}$/,
    pattern: /^https?:\/\/(www\.)?snapchat\.com\/(add|t|@)\/?[A-Za-z0-9._-]+\/?/i,
    buildUrl: (u) => `https://snapchat.com/add/${u}`,
  },
];

export const DEFS: Record<Platform, PlatformDef> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p])
) as Record<Platform, PlatformDef>;

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Given whatever the user typed or pasted, extract just the handle:
// - `@ana` → `ana`
// - `https://instagram.com/ana` → `ana`
// - `instagram.com/@ana/reels` → `ana`
// - `ana` → `ana`
export function extractUsername(input: string): string {
  let s = input.trim();
  if (!s) return "";
  const looksLikeUrl = /^https?:\/\//i.test(s) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s);
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const parts = url.pathname.split("/").filter(Boolean);
      s = parts[parts.length - 1] ?? "";
    } catch {
      // fall through — treat as plain handle
    }
  }
  return s.replace(/^@+/, "");
}

// Given raw user input (a handle, or a pasted full URL), returns either
// the canonical URL for that platform, or a French error message.
export function validateUsername(
  platform: Platform,
  raw: string
): { ok: true; username: string; url: string } | { ok: false; error: string } {
  const def = DEFS[platform];
  const username = extractUsername(raw);
  if (!username) return { ok: false, error: `Entre ton pseudo ${def.label}.` };
  if (!def.usernamePattern.test(username)) {
    return {
      ok: false,
      error: `Pseudo ${def.label} invalide (lettres, chiffres, . _ -).`,
    };
  }
  return { ok: true, username, url: def.buildUrl(username) };
}

// Direct URL validation — used when a full URL is supplied (server contract,
// or when hydrating an already-stored value).
export function validateSocialUrl(
  platform: Platform,
  rawUrl: string
): { ok: true; url: string } | { ok: false; error: string } {
  const def = DEFS[platform];
  const url = normalizeUrl(rawUrl);
  if (!url) return { ok: false, error: "Lien vide." };
  if (!def.pattern.test(url)) {
    return {
      ok: false,
      error: `Lien ${def.label} invalide. Exemple : https://${def.urlPrefix}${def.usernameHint}`,
    };
  }
  return { ok: true, url };
}
