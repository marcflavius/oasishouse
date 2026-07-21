// POST /functions/v1/verify-otp
// Body: { challenge: string, hmac: string, code: string, form: SubscribeBody }
// - Verifies the signed challenge (HMAC + expiry)
// - Constant-time compares sha256(code) against the challenge's code_hash
// - Re-validates the form server-side (never trusts the client)
// - Ensures form.email matches the challenge's email
// - Inserts the participant and returns { ok: true }

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { sha256Hex, verifyChallenge } from "../_shared/otp.ts";
import { checkRateLimit, clientIp } from "../_shared/ratelimit.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { safeEqual, validateSubscribeBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  const supabase = serviceClient();

  const rl = await checkRateLimit(supabase, clientIp(req), "verify-otp", 10, 15);
  if (!rl.allowed) {
    return jsonResponse(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      429
    );
  }

  let body: {
    challenge?: unknown;
    hmac?: unknown;
    code?: unknown;
    form?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  const { challenge, hmac, code, form } = body;
  if (
    typeof challenge !== "string" ||
    typeof hmac !== "string" ||
    typeof code !== "string" ||
    !form ||
    typeof form !== "object"
  ) {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  const verdict = await verifyChallenge(challenge, hmac);
  if (!verdict.ok) {
    if (verdict.reason === "expired") {
      return jsonResponse(
        { error: "Ce code a expiré. Demande un nouveau code." },
        410
      );
    }
    return jsonResponse({ error: "Code invalide." }, 400);
  }

  const providedHash = await sha256Hex(code.trim());
  if (!safeEqual(providedHash, verdict.payload.code_hash)) {
    return jsonResponse({ error: "Code incorrect." }, 401);
  }

  // Re-run the same validation that subscribe used. Client could tamper with
  // form fields between subscribe and verify — trust nothing.
  const validation = validateSubscribeBody(form as Record<string, unknown>);
  if (!validation.ok) return jsonResponse({ error: validation.error }, 400);
  if (validation.honeypot) return jsonResponse({ ok: true });

  const clean = validation.data;

  // Lock the row to the email that received the code.
  if (clean.email !== verdict.payload.email) {
    return jsonResponse({ error: "Email incohérent avec le code." }, 400);
  }

  const { error } = await supabase
    .from("participants")
    .upsert(clean, { onConflict: "email" });

  if (error) {
    console.error("insert error", error);
    return jsonResponse({ error: "Impossible d'enregistrer l'inscription." }, 500);
  }

  return jsonResponse({ ok: true });
});
