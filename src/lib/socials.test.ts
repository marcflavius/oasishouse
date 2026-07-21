import { describe, it, expect } from "vitest";
import { PLATFORMS, normalizeUrl, validateSocialUrl } from "./socials";

describe("normalizeUrl", () => {
  it("trims whitespace", () => {
    expect(normalizeUrl("  https://x.com/foo  ")).toBe("https://x.com/foo");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeUrl("")).toBe("");
    expect(normalizeUrl("   ")).toBe("");
  });

  it("prefixes https:// when scheme is missing", () => {
    expect(normalizeUrl("instagram.com/foo")).toBe("https://instagram.com/foo");
  });

  it("keeps existing http:// or https:// scheme", () => {
    expect(normalizeUrl("http://foo.com")).toBe("http://foo.com");
    expect(normalizeUrl("HTTPS://foo.com")).toBe("HTTPS://foo.com");
  });
});

describe("validateSocialUrl", () => {
  const VALID: Array<[string, string]> = [
    ["instagram", "https://instagram.com/tonpseudo"],
    ["instagram", "instagram.com/tonpseudo"], // https:// gets auto-added
    ["instagram", "https://www.instagram.com/user.name-1"],
    ["tiktok", "https://tiktok.com/@tonpseudo"],
    ["tiktok", "https://vm.tiktok.com/abcXYZ"],
    ["tiktok", "https://www.tiktok.com/@user.name"],
    ["youtube", "https://youtube.com/@tachaine"],
    ["youtube", "https://youtu.be/dQw4w9WgXcQ"],
    ["youtube", "https://www.youtube.com/channel/UC1234567890"],
    ["twitter", "https://x.com/tonpseudo"],
    ["twitter", "https://twitter.com/tonpseudo"],
    ["facebook", "https://facebook.com/tonpseudo"],
    ["facebook", "https://fb.me/tonpseudo"],
    ["twitch", "https://twitch.tv/streamer_1"],
    ["snapchat", "https://snapchat.com/add/tonpseudo"],
    ["snapchat", "https://snapchat.com/t/abc123"],
  ];

  it.each(VALID)("accepts valid %s url: %s", (platform, url) => {
    // deno-lint-ignore no-explicit-any -- test data cast
    const r = validateSocialUrl(platform as any, url);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toMatch(/^https?:\/\//i);
  });

  const INVALID: Array<[string, string]> = [
    ["instagram", "https://facebook.com/foo"],
    ["instagram", "not a url"],
    ["tiktok", "https://instagram.com/foo"],
    ["youtube", "https://vimeo.com/12345"],
    ["twitter", "https://x.com/"],
    ["facebook", "https://linkedin.com/in/foo"],
    ["twitch", "https://kick.com/streamer"],
    ["snapchat", "https://snapchat.com/no-prefix"],
  ];

  it.each(INVALID)("rejects invalid %s url: %s", (platform, url) => {
    // deno-lint-ignore no-explicit-any -- test data cast
    const r = validateSocialUrl(platform as any, url);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/invalide/i);
  });

  it("rejects empty urls", () => {
    const r = validateSocialUrl("instagram", "");
    expect(r.ok).toBe(false);
  });
});

describe("PLATFORMS registry", () => {
  it("has 7 platforms", () => {
    expect(PLATFORMS).toHaveLength(7);
  });

  it("uses lowercase kebab-safe keys", () => {
    for (const p of PLATFORMS) {
      expect(p.key).toMatch(/^[a-z]+$/);
    }
  });

  it("has no duplicate keys", () => {
    const keys = PLATFORMS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
