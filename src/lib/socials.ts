// Shared config for social platforms — imported by both the SocialsPicker UI
// and its tests. Keep in sync with the server-side allow-list in
// supabase/functions/subscribe/index.ts.

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
  hint: string;
  pattern: RegExp;
  // When true, the icon asset is a complete circular logo (bg + glyph baked in)
  // and should fill its container instead of being placed on a brand-colored disc.
  prerendered?: boolean;
}

export const PLATFORMS: PlatformDef[] = [
  {
    key: "instagram", label: "Instagram", color: "#E4405F", hint: "instagram.com/tonpseudo",
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?/i,
  },
  {
    key: "tiktok", label: "TikTok", color: "#000000", hint: "tiktok.com/@tonpseudo", prerendered: true,
    pattern: /^https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/(@?[A-Za-z0-9._-]+)\/?/i,
  },
  {
    key: "youtube", label: "YouTube", color: "#FF0000", hint: "youtube.com/@tachaine",
    pattern: /^https?:\/\/(www\.|m\.)?(youtube\.com\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+|user\/[A-Za-z0-9._-]+)|youtu\.be\/[A-Za-z0-9_-]+)\/?/i,
  },
  {
    key: "twitter", label: "X", color: "#0f172a", hint: "x.com/tonpseudo",
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}\/?/i,
  },
  {
    key: "facebook", label: "Facebook", color: "#1877F2", hint: "facebook.com/tonpseudo",
    pattern: /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9.\-_/]+\/?/i,
  },
  {
    key: "twitch", label: "Twitch", color: "#9146FF", hint: "twitch.tv/tonpseudo",
    pattern: /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]+\/?/i,
  },
  {
    key: "snapchat", label: "Snapchat", color: "#FFCC00", hint: "snapchat.com/add/tonpseudo",
    pattern: /^https?:\/\/(www\.)?snapchat\.com\/(add|t|@)\/?[A-Za-z0-9._-]+\/?/i,
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
      error: `Lien ${def.label} invalide. Exemple : https://${def.hint}`,
    };
  }
  return { ok: true, url };
}
