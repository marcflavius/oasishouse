// POST /functions/v1/verify
// Body: { token: string }
// Returns: { status: "success" | "already" | "invalid" }

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { decideVerifyStatus } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  let token: string | undefined;
  try {
    ({ token } = await req.json());
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  if (!token || typeof token !== "string") {
    return jsonResponse({ status: "invalid" });
  }

  const supabase = serviceClient();

  const { data: row, error } = await supabase
    .from("participants")
    .select("id, verified, token_expires_at")
    .eq("verification_token", token)
    .maybeSingle();

  if (error) {
    console.error("lookup error", error);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  const status = decideVerifyStatus(row);
  if (status !== "success") {
    return jsonResponse({ status });
  }

  const { error: updateError } = await supabase
    .from("participants")
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      verification_token: null,
      token_expires_at: null,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("update error", updateError);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  return jsonResponse({ status: "success" });
});
