// Pure validation helpers for the subscribe edge function.
// Kept side-effect-free so they can be exercised in Deno tests without
// needing network/env/service-role.

export interface SocialInput {
  platform?: unknown;
  url?: unknown;
}

export interface SubscribeBody {
  prenom?: unknown;
  nom?: unknown;
  blaze?: unknown;
  email?: unknown;
  telephone?: unknown;
  age?: unknown;
  motivation?: unknown;
  socials?: unknown;
  hp?: unknown;
}

export interface CleanParticipant {
  prenom: string;
  nom: string;
  blaze: string | null;
  email: string;
  telephone: string;
  age: number;
  motivation: string;
  socials: { platform: string; url: string }[];
}

export type ValidationResult =
  | { ok: true; honeypot: false; data: CleanParticipant }
  | { ok: true; honeypot: true } // silently swallow
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ALLOWED_PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
  "twitch",
  "snapchat",
]);

export function sanitizeSocials(input: unknown): { platform: string; url: string }[] {
  if (!Array.isArray(input)) return [];
  const out: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const raw of input.slice(0, 8)) {
    const platform = String((raw as SocialInput)?.platform ?? "").toLowerCase();
    let url = String((raw as SocialInput)?.url ?? "").trim();
    if (!ALLOWED_PLATFORMS.has(platform) || !url || seen.has(platform)) continue;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      continue;
    }
    if (url.length > 500) continue;
    seen.add(platform);
    out.push({ platform, url });
  }
  return out;
}

export function validateSubscribeBody(body: SubscribeBody): ValidationResult {
  // Honeypot — silently accept-and-drop.
  const hp = typeof body.hp === "string" ? body.hp.trim() : "";
  if (hp !== "") return { ok: true, honeypot: true };

  const prenom = typeof body.prenom === "string" ? body.prenom.trim() : "";
  const nom = typeof body.nom === "string" ? body.nom.trim() : "";
  const blaze = typeof body.blaze === "string" ? body.blaze.trim().slice(0, 60) : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const telephone = typeof body.telephone === "string" ? body.telephone.trim() : "";
  const motivation = typeof body.motivation === "string" ? body.motivation.trim() : "";
  const socials = sanitizeSocials(body.socials);
  const ageNum =
    typeof body.age === "number"
      ? body.age
      : parseInt(String(body.age ?? ""), 10);

  if (!prenom || !nom) {
    return { ok: false, error: "Prénom et nom obligatoires." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email invalide." };
  }
  if (!telephone) {
    return { ok: false, error: "Téléphone obligatoire." };
  }
  if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99) {
    return { ok: false, error: "Tu dois avoir au moins 18 ans." };
  }
  if (motivation.length < 10) {
    return { ok: false, error: "Motivation trop courte." };
  }
  if (socials.length === 0) {
    return { ok: false, error: "Ajoute au moins un lien réseau social." };
  }

  return {
    ok: true,
    honeypot: false,
    data: {
      prenom,
      nom,
      blaze: blaze || null,
      email,
      telephone,
      age: ageNum,
      motivation,
      socials,
    },
  };
}

// Constant-time-ish string compare to blunt trivial timing attacks.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Random hex token, 64 chars from 32 random bytes.
export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type VerifyStatus = "success" | "already" | "invalid";

export interface VerifyRow {
  verified: boolean;
  token_expires_at: string | null;
}

// Pure state machine: given the row (or null) and the current time,
// decide what /verify should respond with.
export function decideVerifyStatus(
  row: VerifyRow | null,
  now: Date = new Date()
): VerifyStatus {
  if (!row) return "invalid";
  if (row.verified) return "already";
  if (row.token_expires_at && new Date(row.token_expires_at) < now) return "invalid";
  return "success";
}
