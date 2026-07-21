// POST /functions/v1/subscribe
// Body: { prenom, nom, email, telephone, ile, age, motivation, hp }
// - Validates input, silently swallows honeypot submissions
// - Inserts (or refreshes token for) a participant row
// - Sends a French verification email via Resend

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

interface Body {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  ile?: string;
  age?: string | number;
  motivation?: string;
  hp?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide." }, 400);
  }

  // Honeypot — pretend it worked, but do nothing.
  if (body.hp && body.hp.trim() !== "") {
    return jsonResponse({ ok: true });
  }

  const prenom = body.prenom?.trim() ?? "";
  const nom = body.nom?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const telephone = body.telephone?.trim() ?? "";
  const ile = body.ile?.trim() ?? "";
  const motivation = body.motivation?.trim() ?? "";
  const ageNum = typeof body.age === "number" ? body.age : parseInt(String(body.age ?? ""), 10);

  if (!prenom || !nom) {
    return jsonResponse({ error: "Prénom et nom obligatoires." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: "Email invalide." }, 400);
  }
  if (!telephone) {
    return jsonResponse({ error: "Téléphone obligatoire." }, 400);
  }
  if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99) {
    return jsonResponse({ error: "Tu dois avoir au moins 18 ans." }, 400);
  }
  if (!ile) {
    return jsonResponse({ error: "Île obligatoire." }, 400);
  }
  if (motivation.length < 10) {
    return jsonResponse({ error: "Motivation trop courte." }, 400);
  }

  const token = randomToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const supabase = serviceClient();

  // Upsert by email: if the person re-submits, refresh their token & data
  // instead of rejecting on the unique constraint.
  const { error } = await supabase
    .from("participants")
    .upsert(
      {
        prenom,
        nom,
        email,
        telephone,
        age: ageNum,
        ile,
        motivation,
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
    await sendVerificationEmail(email, prenom, token);
  } catch (err) {
    console.error("email error", err);
    return jsonResponse(
      { error: "Inscription enregistrée mais l'email n'a pas pu être envoyé." },
      500
    );
  }

  return jsonResponse({ ok: true });
});
