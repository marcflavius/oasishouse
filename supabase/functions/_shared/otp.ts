// Stateless OTP challenge — no DB row is created before the code is verified.
// Server generates a 6-digit code, hashes it, and signs a challenge blob
// { email, code_hash, expires_at } with HMAC-SHA256(OTP_SECRET).
// The client stores { challenge, hmac } in memory and sends it back at verify
// time; server re-derives the HMAC and refuses tampered/expired blobs.

const encoder = new TextEncoder();

export interface ChallengePayload {
  email: string;
  code_hash: string;   // hex sha256
  expires_at: number;  // unix ms
}

export interface SignedChallenge {
  challenge: string; // base64url(JSON.stringify(payload))
  hmac: string;      // base64url(HMAC-SHA256(secret, challenge))
}

// 6-digit numeric code as a zero-padded string.
export function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function getSecret(): string {
  const secret = Deno.env.get("OTP_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error(
      "OTP_SECRET missing or too short (min 32 chars). Set it as an Edge Function secret."
    );
  }
  return secret;
}

export async function signChallenge(payload: ChallengePayload): Promise<SignedChallenge> {
  const challenge = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(getSecret());
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(challenge))
  );
  return { challenge, hmac: b64urlEncode(sig) };
}

// Constant-time byte compare. Same length check first to avoid revealing length.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export type ChallengeVerdict =
  | { ok: true; payload: ChallengePayload }
  | { ok: false; reason: "tampered" | "malformed" | "expired" };

export async function verifyChallenge(
  challenge: string,
  hmac: string,
  now: number = Date.now()
): Promise<ChallengeVerdict> {
  let expectedSig: Uint8Array;
  let providedSig: Uint8Array;
  try {
    const key = await importKey(getSecret());
    expectedSig = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(challenge))
    );
    providedSig = b64urlDecode(hmac);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!timingSafeEqual(expectedSig, providedSig)) {
    return { ok: false, reason: "tampered" };
  }

  let payload: ChallengePayload;
  try {
    const json = new TextDecoder().decode(b64urlDecode(challenge));
    payload = JSON.parse(json);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    typeof payload?.email !== "string" ||
    typeof payload?.code_hash !== "string" ||
    typeof payload?.expires_at !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  if (payload.expires_at < now) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}
