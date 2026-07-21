// POST /functions/v1/subscribe
// Body: { prenom, nom, email, telephone, ile, age, motivation, hp }
// - Validates input, silently swallows honeypot submissions
// - Inserts (or refreshes token for) a participant row
// - Sends a French verification email via Resend

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

interface SocialInput {
  platform?: string;
  url?: string;
}

interface Body {
  prenom?: string;
  nom?: string;
  blaze?: string;
  email?: string;
  telephone?: string;
  age?: string | number;
  motivation?: string;
  socials?: SocialInput[];
  hp?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
  "twitch",
  "snapchat",
]);

function sanitizeSocials(input: unknown): { platform: string; url: string }[] {
  if (!Array.isArray(input)) return [];
  const out: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const raw of input.slice(0, 8)) {
    const platform = String((raw as SocialInput)?.platform ?? "").toLowerCase();
    let url = String((raw as SocialInput)?.url ?? "").trim();
    if (!ALLOWED_PLATFORMS.has(platform) || !url || seen.has(platform)) continue;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      // Validate as URL; reject anything that doesn't parse.
      new URL(url);
    } catch {
      continue;
    }
    if (url.length > 500) continue;
    seen.add(platform);
    out.push({ platform, url });
  }
  return out;
}

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
  const blaze = body.blaze?.trim().slice(0, 60) ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const telephone = body.telephone?.trim() ?? "";
  const motivation = body.motivation?.trim() ?? "";
  const socials = sanitizeSocials(body.socials);
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
  if (motivation.length < 10) {
    return jsonResponse({ error: "Motivation trop courte." }, 400);
  }
  if (socials.length === 0) {
    return jsonResponse({ error: "Ajoute au moins un lien réseau social." }, 400);
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
        blaze: blaze || null,
        email,
        telephone,
        age: ageNum,
        socials,
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
