// POST /functions/v1/admin-delete-participant
// Body: { password: string, id: string }
// Returns: { ok: true }

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { safeEqual } from "../_shared/validation.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  let body: { password?: unknown; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  const password = body.password;
  const id = body.id;

  if (typeof password !== "string" || !safeEqual(password, expected)) {
    return jsonResponse({ error: "Mot de passe incorrect." }, 401);
  }
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return jsonResponse({ error: "Identifiant invalide." }, 400);
  }

  const supabase = serviceClient();
  const { error } = await supabase.from("participants").delete().eq("id", id);

  if (error) {
    console.error("delete error", error);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  return jsonResponse({ ok: true });
});
