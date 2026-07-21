import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ALLOWED_PLATFORMS,
  decideVerifyStatus,
  randomToken,
  safeEqual,
  sanitizeSocials,
  validateSubscribeBody,
} from "./validation.ts";

// ---------------------------------------------------------------- sanitizeSocials

Deno.test("sanitizeSocials — returns [] for non-arrays", () => {
  assertEquals(sanitizeSocials(null), []);
  assertEquals(sanitizeSocials(undefined), []);
  assertEquals(sanitizeSocials("string"), []);
  assertEquals(sanitizeSocials({}), []);
});

Deno.test("sanitizeSocials — drops unknown platforms", () => {
  const out = sanitizeSocials([
    { platform: "myspace", url: "https://myspace.com/x" },
    { platform: "instagram", url: "https://instagram.com/ana" },
  ]);
  assertEquals(out, [{ platform: "instagram", url: "https://instagram.com/ana" }]);
});

Deno.test("sanitizeSocials — auto-prefixes https://", () => {
  const out = sanitizeSocials([{ platform: "instagram", url: "instagram.com/ana" }]);
  assertEquals(out, [{ platform: "instagram", url: "https://instagram.com/ana" }]);
});

Deno.test("sanitizeSocials — drops duplicate platforms (keeps first)", () => {
  const out = sanitizeSocials([
    { platform: "instagram", url: "https://instagram.com/a" },
    { platform: "instagram", url: "https://instagram.com/b" },
  ]);
  assertEquals(out.length, 1);
  assertEquals(out[0].url, "https://instagram.com/a");
});

Deno.test("sanitizeSocials — normalizes platform casing", () => {
  const out = sanitizeSocials([{ platform: "INSTAGRAM", url: "https://instagram.com/a" }]);
  assertEquals(out, [{ platform: "instagram", url: "https://instagram.com/a" }]);
});

Deno.test("sanitizeSocials — caps at 8 entries", () => {
  const platforms = Array.from(ALLOWED_PLATFORMS);
  const many = [
    ...platforms.map((p) => ({ platform: p, url: `https://${p}.example.com/u` })),
    // 2 extras of already-used platforms — the slice(0,8) trims the raw list first
    { platform: "instagram", url: "https://instagram.com/dup" },
    { platform: "tiktok", url: "https://tiktok.com/@dup" },
  ];
  const out = sanitizeSocials(many);
  // 7 allowed platforms → 7 entries (dedup by platform)
  assertEquals(out.length, platforms.length);
});

Deno.test("sanitizeSocials — drops entries with empty url", () => {
  const out = sanitizeSocials([{ platform: "instagram", url: "" }]);
  assertEquals(out, []);
});

Deno.test("sanitizeSocials — drops URLs > 500 chars", () => {
  const huge = "https://instagram.com/" + "a".repeat(600);
  const out = sanitizeSocials([{ platform: "instagram", url: huge }]);
  assertEquals(out, []);
});

// ---------------------------------------------------------------- validateSubscribeBody

const validBody = {
  prenom: "Ana",
  nom: "Diaz",
  email: "ana@example.com",
  telephone: "+594010101010",
  age: "25",
  motivation: "je veux vivre cette aventure",
  socials: [{ platform: "instagram", url: "https://instagram.com/ana" }],
  hp: "",
};

Deno.test("validateSubscribeBody — accepts a fully-valid body", () => {
  const r = validateSubscribeBody(validBody);
  if (!r.ok || r.honeypot) throw new Error("expected clean result");
  assertEquals(r.data.email, "ana@example.com");
  assertEquals(r.data.age, 25);
  assertEquals(r.data.blaze, null);
});

Deno.test("validateSubscribeBody — honeypot triggers silent success", () => {
  const r = validateSubscribeBody({ ...validBody, hp: "i am a bot" });
  assertEquals(r, { ok: true, honeypot: true });
});

Deno.test("validateSubscribeBody — rejects missing name", () => {
  const r = validateSubscribeBody({ ...validBody, prenom: "" });
  if (r.ok) throw new Error("expected error");
  assertEquals(r.error.includes("Prénom"), true);
});

Deno.test("validateSubscribeBody — rejects invalid email", () => {
  const r = validateSubscribeBody({ ...validBody, email: "not-an-email" });
  if (r.ok) throw new Error("expected error");
  assertEquals(r.error, "Email invalide.");
});

Deno.test("validateSubscribeBody — rejects age < 18", () => {
  const r = validateSubscribeBody({ ...validBody, age: "17" });
  if (r.ok) throw new Error("expected error");
  assertEquals(r.error.includes("18 ans"), true);
});

Deno.test("validateSubscribeBody — rejects motivation too short", () => {
  const r = validateSubscribeBody({ ...validBody, motivation: "hi" });
  if (r.ok) throw new Error("expected error");
  assertEquals(r.error.includes("Motivation"), true);
});

Deno.test("validateSubscribeBody — rejects empty socials", () => {
  const r = validateSubscribeBody({ ...validBody, socials: [] });
  if (r.ok) throw new Error("expected error");
  assertEquals(r.error.includes("réseau social"), true);
});

Deno.test("validateSubscribeBody — lowercases email", () => {
  const r = validateSubscribeBody({ ...validBody, email: "  ANA@EXAMPLE.COM  " });
  if (!r.ok || r.honeypot) throw new Error("expected clean result");
  assertEquals(r.data.email, "ana@example.com");
});

Deno.test("validateSubscribeBody — truncates blaze at 60 chars", () => {
  const long = "a".repeat(100);
  const r = validateSubscribeBody({ ...validBody, blaze: long });
  if (!r.ok || r.honeypot) throw new Error("expected clean result");
  assertEquals(r.data.blaze?.length, 60);
});

Deno.test("validateSubscribeBody — accepts numeric age", () => {
  const r = validateSubscribeBody({ ...validBody, age: 30 });
  if (!r.ok || r.honeypot) throw new Error("expected clean result");
  assertEquals(r.data.age, 30);
});

// ---------------------------------------------------------------- decideVerifyStatus

Deno.test("decideVerifyStatus — invalid when row is null", () => {
  assertEquals(decideVerifyStatus(null), "invalid");
});

Deno.test("decideVerifyStatus — already when row is already verified", () => {
  assertEquals(
    decideVerifyStatus({ verified: true, token_expires_at: null }),
    "already"
  );
});

Deno.test("decideVerifyStatus — invalid when token is expired", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  assertEquals(
    decideVerifyStatus({ verified: false, token_expires_at: past }),
    "invalid"
  );
});

Deno.test("decideVerifyStatus — success when unverified and not expired", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  assertEquals(
    decideVerifyStatus({ verified: false, token_expires_at: future }),
    "success"
  );
});

Deno.test("decideVerifyStatus — success when unverified and no expiry set", () => {
  assertEquals(
    decideVerifyStatus({ verified: false, token_expires_at: null }),
    "success"
  );
});

// ---------------------------------------------------------------- safeEqual

Deno.test("safeEqual — true for identical strings", () => {
  assertEquals(safeEqual("hunter2", "hunter2"), true);
});

Deno.test("safeEqual — false for different lengths", () => {
  assertEquals(safeEqual("abc", "abcd"), false);
});

Deno.test("safeEqual — false for same-length different strings", () => {
  assertEquals(safeEqual("hunter1", "hunter2"), false);
});

Deno.test("safeEqual — true for empty strings", () => {
  assertEquals(safeEqual("", ""), true);
});

// ---------------------------------------------------------------- randomToken

Deno.test("randomToken — returns 64 lowercase hex chars", () => {
  const t = randomToken();
  assertEquals(t.length, 64);
  assertEquals(/^[0-9a-f]{64}$/.test(t), true);
});

Deno.test("randomToken — is different each call", () => {
  const a = randomToken();
  const b = randomToken();
  if (a === b) throw new Error("random tokens should not collide");
});
