// POST /functions/v1/subscribe
// Body: { prenom, nom, blaze?, email, telephone, age, motivation, socials, hp }
// - Validates input (see _shared/validation.ts), silently swallows honeypot submissions
// - Inserts (or refreshes token for) a participant row
// - Sends a French verification email via Resend

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { randomToken, validateSubscribeBody } from "../_shared/validation.ts";

function verificationEmailHtml(prenom: string, url: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h1 style="color:#0ea5e9;">Confirme ta candidature</h1>
      <p>Bonjour ${prenom},</p>
      <p>Merci pour ton inscription au casting <strong>Oasis House Caribbean</strong> !
         Pour finaliser ta candidature, clique sur le bouton ci-dessous&nbsp;:</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="${url}"
           style="display:inline-block; background:#ff6b6b; color:white; padding:14px 28px; border-radius:9999px; text-decoration:none; font-weight:600;">
          Confirmer mon email
        </a>
      </p>
      <p style="font-size: 13px; color:#64748b;">
        Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur&nbsp;:<br />
        <a href="${url}">${url}</a>
      </p>
      <p style="font-size: 13px; color:#64748b;">Ce lien expire dans 24 heures.</p>
    </div>
  `;
}

async function sendVerificationEmail(
  to: string,
  prenom: string,
  token: string
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");
  const site = Deno.env.get("SITE_URL");
  if (!apiKey || !from || !site) {
    throw new Error("RESEND_API_KEY / RESEND_FROM / SITE_URL missing.");
  }

  const url = `${site.replace(/\/$/, "")}/verifier?token=${token}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Confirme ton inscription — Oasis House Caribbean",
      html: verificationEmailHtml(prenom, url),
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
  const token = randomToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const supabase = serviceClient();

  // Upsert by email: if the person re-submits, refresh their token & data
  // instead of rejecting on the unique constraint.
  const { error } = await supabase.from("participants").upsert(
    {
      ...clean,
      verified: false,
      verified_at: null,
      verification_token: token,
      token_expires_at: expires,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("insert error", error);
    return jsonResponse({ error: "Impossible d'enregistrer l'inscription." }, 500);
  }

  try {
    await sendVerificationEmail(clean.email, clean.prenom, token);
  } catch (err) {
    console.error("email error", err);
    return jsonResponse(
      { error: "Inscription enregistrée mais l'email n'a pas pu être envoyé." },
      500
    );
  }

  return jsonResponse({ ok: true });
});
