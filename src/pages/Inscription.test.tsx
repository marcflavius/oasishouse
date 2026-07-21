import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Inscription from "./Inscription";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return {
    ...actual,
    subscribe: vi.fn(),
    verifyOtp: vi.fn(),
    checkSocial: vi.fn(),
  };
});

const subscribeMock = api.subscribe as unknown as ReturnType<typeof vi.fn>;
const verifyOtpMock = api.verifyOtp as unknown as ReturnType<typeof vi.fn>;
const checkSocialMock = api.checkSocial as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  subscribeMock.mockReset();
  verifyOtpMock.mockReset();
  checkSocialMock.mockReset();
  checkSocialMock.mockResolvedValue({ ok: true, exists: true, status: 200 });
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
  const input = await screen.findByPlaceholderText("tonpseudo");
  await user.type(input, "ana{Enter}");
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

  it("opens the OTP modal after a successful subscribe, then shows success on valid code", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockResolvedValue({ ok: true, challenge: "c1", hmac: "h1" });
    verifyOtpMock.mockResolvedValue({ ok: true });

    render(<Inscription />);
    await fillMinimumForm(user);
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    // Modal is open — not the success panel yet.
    expect(await screen.findByLabelText(/Code à 6 chiffres/i)).toBeInTheDocument();
    expect(subscribeMock).toHaveBeenCalledTimes(1);

    const codeInput = screen.getByLabelText(/Code à 6 chiffres/i);
    await user.type(codeInput, "123456");
    await user.click(screen.getByRole("button", { name: /Valider mon code/i }));

    expect(await screen.findByText(/Merci/i)).toBeInTheDocument();
    expect(verifyOtpMock).toHaveBeenCalledTimes(1);
    const [challenge, hmac, code, form] = verifyOtpMock.mock.calls[0];
    expect(challenge).toBe("c1");
    expect(hmac).toBe("h1");
    expect(code).toBe("123456");
    expect(form.email).toBe("ana@example.com");
  });

  it("shows the server error message when subscribe rejects", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockRejectedValue(new Error("Email invalide."));

    render(<Inscription />);
    await fillMinimumForm(user);
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(await screen.findByText("Email invalide.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Code à 6 chiffres/i)).not.toBeInTheDocument();
  });

  it("keeps the modal open and shows the error when the code is wrong", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockResolvedValue({ ok: true, challenge: "c1", hmac: "h1" });
    verifyOtpMock.mockRejectedValue(new Error("Code incorrect."));

    render(<Inscription />);
    await fillMinimumForm(user);
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    const codeInput = await screen.findByLabelText(/Code à 6 chiffres/i);
    await user.type(codeInput, "999999");
    await user.click(screen.getByRole("button", { name: /Valider mon code/i }));

    expect(await screen.findByText("Code incorrect.")).toBeInTheDocument();
    expect(screen.queryByText(/Merci/i)).not.toBeInTheDocument();
  });

  it("includes the blaze nickname in the payload when filled", async () => {
    const user = userEvent.setup({ delay: null });
    subscribeMock.mockResolvedValue({ ok: true, challenge: "c1", hmac: "h1" });
    verifyOtpMock.mockResolvedValue({ ok: true });

    render(<Inscription />);
    await fillMinimumForm(user);
    await user.type(screen.getByLabelText(/^Blaze/i), "AnaTheStar");
    await addOneSocial(user);
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    await screen.findByLabelText(/Code à 6 chiffres/i);
    expect(subscribeMock.mock.calls[0][0].blaze).toBe("AnaTheStar");
  });
});
