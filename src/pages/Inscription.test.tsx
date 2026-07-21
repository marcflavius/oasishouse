import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Inscription from "./Inscription";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return { ...actual, subscribe: vi.fn() };
});

const subscribeMock = api.subscribe as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  subscribeMock.mockReset();
});

async function fillMinimumForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Prénom$/i), "Ana");
  await user.type(screen.getByLabelText(/^Nom$/i), "Diaz");
  await user.type(screen.getByLabelText(/^Email$/i), "ana@example.com");
  await user.type(screen.getByLabelText(/Téléphone/i), "+594010101010");
  await user.type(screen.getByLabelText(/^Âge$/i), "25");
  await user.type(
    screen.getByLabelText(/Pourquoi veux-tu participer/i),
    "je veux vivre cette aventure incroyable"
  );
}

async function addOneSocial(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/Ajouter Instagram/i));
  const input = await screen.findByPlaceholderText(/instagram\.com\/tonpseudo/i);
  await user.type(input, "instagram.com/ana{Enter}");
}

describe("<Inscription />", () => {
  it("blocks submission when no social is added", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Inscription />);

    await fillMinimumForm(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(subscribeMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/au moins un lien réseau social/i)
    ).toBeInTheDocument();
  });

  it("submits when the form is valid and shows the success panel", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockResolvedValue({ ok: true });

    render(<Inscription />);
    await fillMinimumForm(user);
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(await screen.findByText(/Merci/i)).toBeInTheDocument();
    expect(subscribeMock).toHaveBeenCalledTimes(1);
    const payload = subscribeMock.mock.calls[0][0];
    expect(payload.email).toBe("ana@example.com");
    expect(payload.socials).toEqual([
      { platform: "instagram", url: "https://instagram.com/ana" },
    ]);
    // Blaze is optional and left blank in the minimum form.
    expect(payload.blaze).toBe("");
  });

  it("shows the server error message when subscribe rejects", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockRejectedValue(new Error("Email invalide."));

    render(<Inscription />);
    await fillMinimumForm(user);
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(await screen.findByText("Email invalide.")).toBeInTheDocument();
  });

  it("includes the blaze nickname in the payload when filled", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockResolvedValue({ ok: true });

    render(<Inscription />);
    await fillMinimumForm(user);
    await user.type(screen.getByLabelText(/^Blaze/i), "AnaTheStar");
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    await screen.findByText(/Merci/i);
    expect(subscribeMock.mock.calls[0][0].blaze).toBe("AnaTheStar");
  });
});
