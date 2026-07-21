// POST /functions/v1/admin-participants
// Body: { password: string }
// Returns: { participants: Participant[] }

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

// Constant-time-ish string compare to blunt trivial timing attacks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  const expected = Deno.env.get("ADMIN_PASSWORD");
  if (!expected) {
    return jsonResponse(
      { error: "ADMIN_PASSWORD non configuré côté serveur." },
      500
    );
  }

  let password: string | undefined;
  try {
    ({ password } = await req.json());
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  if (typeof password !== "string" || !safeEqual(password, expected)) {
    return jsonResponse({ error: "Mot de passe incorrect." }, 401);
  }

  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("participants")
    .select(
      "id, created_at, prenom, nom, email, telephone, age, ile, motivation, verified, verified_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list error", error);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  return jsonResponse({ participants: data ?? [] });
});
