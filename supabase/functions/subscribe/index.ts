// POST /functions/v1/subscribe
// Body: { prenom, nom, blaze?, email, telephone, age, motivation, socials, hp }
// - Validates input (see _shared/validation.ts), silently swallows honeypot submissions
// - Sends a 6-digit code via email using Resend
// - Returns a signed challenge blob { challenge, hmac } — no participant row is
//   created until verify-otp confirms the code.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { generateCode, sha256Hex, signChallenge } from "../_shared/otp.ts";
import { checkRateLimit, clientIp } from "../_shared/ratelimit.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { validateSubscribeBody } from "../_shared/validation.ts";

const CODE_TTL_MS = 15 * 60 * 1000;

function codeEmailHtml(prenom: string, code: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h1 style="color:#0ea5e9;">Ton code de confirmation</h1>
      <p>Bonjour ${prenom},</p>
      <p>Voici ton code pour finaliser ton inscription au casting
         <strong>Oasis House Caribbean</strong>&nbsp;:</p>
      <p style="text-align:center; margin: 32px 0;">
        <span style="display:inline-block; letter-spacing: 12px; font-size: 40px;
                     font-weight: 700; font-family: 'SF Mono', Menlo, Consolas, monospace;
                     background: #f1f5f9; color: #0f172a; padding: 16px 24px;
                     border-radius: 12px;">
          ${code}
        </span>
      </p>
      <p style="font-size: 14px; color:#64748b;">
        Saisis ce code dans la fenêtre ouverte sur le site pour valider ta candidature.
      </p>
      <p style="font-size: 13px; color:#94a3b8;">Ce code expire dans 15 minutes.</p>
    </div>
  `;
}

async function sendCodeEmail(to: string, prenom: string, code: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / RESEND_FROM missing.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Ton code de confirmation — Oasis House Caribbean",
      html: codeEmailHtml(prenom, code),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  const supabase = serviceClient();

  const rl = await checkRateLimit(supabase, clientIp(req), "subscribe", 5, 15);
  if (!rl.allowed) {
    return jsonResponse(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      429
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  const result = validateSubscribeBody(body as Record<string, unknown>);
  if (!result.ok) return jsonResponse({ error: result.error }, 400);
  if (result.honeypot) return jsonResponse({ ok: true });

  const clean = result.data;
  const code = generateCode();
  const code_hash = await sha256Hex(code);
  const expires_at = Date.now() + CODE_TTL_MS;

  let signed;
  try {
    signed = await signChallenge({
      email: clean.email,
      code_hash,
      expires_at,
    });
  } catch (err) {
    console.error("challenge sign error", err);
    return jsonResponse({ error: "Erreur serveur." }, 500);
  }

  try {
    await sendCodeEmail(clean.email, clean.prenom, code);
  } catch (err) {
    console.error("email error", err);
    return jsonResponse(
      { error: "Impossible d'envoyer l'email de confirmation. Vérifie ton adresse." },
      500
    );
  }

  return jsonResponse({ ok: true, challenge: signed.challenge, hmac: signed.hmac });
});
