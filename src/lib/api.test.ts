import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { subscribe, verify, adminList } from "./api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
});

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("subscribe()", () => {
  it("POSTs to the subscribe function with the anon key and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(jsonRes({ ok: true }));

    const result = await subscribe({
      prenom: "Ana",
      nom: "Diaz",
      blaze: "",
      email: "ana@example.com",
      telephone: "+5940101010",
      age: "22",
      motivation: "je veux tenter l'aventure",
      socials: [{ platform: "instagram", url: "https://instagram.com/ana" }],
      hp: "",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://test.supabase.co/functions/v1/subscribe");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-anon-key");
    expect(init.headers.apikey).toBe("test-anon-key");
    expect(JSON.parse(init.body).email).toBe("ana@example.com");
  });

  it("throws with the server-provided error message on non-2xx", async () => {
    fetchMock.mockResolvedValue(jsonRes({ error: "Email invalide." }, 400));

    await expect(
      subscribe({
        prenom: "",
        nom: "",
        blaze: "",
        email: "nope",
        telephone: "",
        age: "",
        motivation: "",
        socials: [],
        hp: "",
      })
    ).rejects.toThrow("Email invalide.");
  });

  it("throws a generic error when server returns no JSON body", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));

    await expect(
      subscribe({
        prenom: "",
        nom: "",
        blaze: "",
        email: "",
        telephone: "",
        age: "",
        motivation: "",
        socials: [],
        hp: "",
      })
    ).rejects.toThrow(/500/);
  });
});

describe("verify()", () => {
  it("returns the parsed status", async () => {
    fetchMock.mockResolvedValue(jsonRes({ status: "success" }));
    const r = await verify("abc123");
    expect(r).toEqual({ status: "success" });
  });
});

describe("adminList()", () => {
  it("returns the participants array", async () => {
    fetchMock.mockResolvedValue(jsonRes({ participants: [{ id: "1" }] }));
    const r = await adminList("hunter2");
    expect(r.participants).toHaveLength(1);
  });

  it("propagates 401 errors", async () => {
    fetchMock.mockResolvedValue(jsonRes({ error: "Mot de passe incorrect." }, 401));
    await expect(adminList("wrong")).rejects.toThrow("Mot de passe incorrect.");
  });
});
