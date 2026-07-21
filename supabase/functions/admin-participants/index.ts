// POST /functions/v1/admin-participants
// Body: { password: string }
// Returns: { participants: Participant[] }

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { safeEqual } from "../_shared/validation.ts";

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
      "id, created_at, prenom, nom, blaze, email, telephone, age, socials, motivation, verified, verified_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list error", error);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  return jsonResponse({ participants: data ?? [] });
});
