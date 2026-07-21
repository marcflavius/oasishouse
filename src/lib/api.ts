// Thin fetch wrappers around the three Supabase Edge Functions.
// The browser only ever holds the public anon key; the participants table
// itself is locked by RLS, so all reads/writes go through these functions.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `Erreur ${res.status}. Réessaie plus tard.`;
    throw new Error(message);
  }
  return data as T;
}

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "facebook"
  | "twitch"
  | "snapchat";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface SubscribeInput {
  prenom: string;
  nom: string;
  blaze: string; // nickname / stage name
  email: string;
  telephone: string;
  age: string; // kept as string from the form; coerced server-side
  motivation: string;
  socials: SocialLink[];
  hp: string; // honeypot — must stay empty
}

export interface SubscribeChallenge {
  ok: true;
  challenge: string;
  hmac: string;
}

export function subscribe(input: SubscribeInput): Promise<SubscribeChallenge> {
  return callFunction("subscribe", input);
}

export function verifyOtp(
  challenge: string,
  hmac: string,
  code: string,
  form: SubscribeInput
): Promise<{ ok: true }> {
  return callFunction("verify-otp", { challenge, hmac, code, form });
}

export interface CheckSocialResult {
  ok: true;
  exists: boolean;
  status: number;
  unknown?: true;
}

export function checkSocial(url: string): Promise<CheckSocialResult> {
  return callFunction("check-social", { url });
}

export interface Participant {
  id: string;
  created_at: string;
  prenom: string;
  nom: string;
  blaze: string | null;
  email: string;
  telephone: string | null;
  age: number | null;
  socials: SocialLink[];
  motivation: string | null;
}

export function adminList(
  password: string
): Promise<{ participants: Participant[] }> {
  return callFunction("admin-participants", { password });
}

export function adminDelete(
  password: string,
  id: string
): Promise<{ ok: true }> {
  return callFunction("admin-delete-participant", { password, id });
}
