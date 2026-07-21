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

export interface SubscribeInput {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ile: string;
  age: string; // kept as string from the form; coerced server-side
  motivation: string;
  hp: string; // honeypot — must stay empty
}

export function subscribe(input: SubscribeInput): Promise<{ ok: true }> {
  return callFunction("subscribe", input);
}

export type VerifyStatus = "success" | "already" | "invalid";

export function verify(token: string): Promise<{ status: VerifyStatus }> {
  return callFunction("verify", { token });
}

export interface Participant {
  id: string;
  created_at: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  age: number | null;
  ile: string | null;
  motivation: string | null;
  verified: boolean;
  verified_at: string | null;
}

export function adminList(
  password: string
): Promise<{ participants: Participant[] }> {
  return callFunction("admin-participants", { password });
}
