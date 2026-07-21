import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Admin from "./Admin";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return { ...actual, adminList: vi.fn(), adminDelete: vi.fn() };
});

const adminListMock = api.adminList as unknown as ReturnType<typeof vi.fn>;
const adminDeleteMock = api.adminDelete as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  adminListMock.mockReset();
  adminDeleteMock.mockReset();
});

describe("<Admin />", () => {
  it("starts in the locked state with a password prompt", () => {
    render(<Admin />);
    expect(screen.getByText(/Espace admin/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mot de passe/i)).toBeInTheDocument();
  });

  it("shows the participants table on successful login", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "1",
          created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana",
          nom: "Diaz",
          blaze: "AnaTheStar",
          email: "ana@example.com",
          telephone: "+594010101010",
          age: 25,
          socials: [{ platform: "instagram", url: "https://instagram.com/ana" }],
          motivation: "aventure",
        },
      ],
    });

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText(/Candidats \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Ana Diaz")).toBeInTheDocument();
    expect(screen.getByText(/AnaTheStar/)).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram/i })).toHaveAttribute(
      "href",
      "https://instagram.com/ana"
    );
    expect(adminListMock).toHaveBeenCalledWith("hunter2");
  });

  it("shows an error message on failed login", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockRejectedValue(new Error("Mot de passe incorrect."));

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "wrong");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText("Mot de passe incorrect.")).toBeInTheDocument();
    expect(screen.queryByText(/Candidats \(/)).not.toBeInTheDocument();
  });

  it("deletes a participant after confirmation and removes the row", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana", nom: "Diaz", blaze: null,
          email: "ana@example.com", telephone: "+594010101010",
          age: 25, socials: [], motivation: "x",
        },
      ],
    });
    adminDeleteMock.mockResolvedValue({ ok: true });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await screen.findByText("Ana Diaz");
    await user.click(screen.getByRole("button", { name: /Supprimer Ana Diaz/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(adminDeleteMock).toHaveBeenCalledWith(
      "hunter2",
      "11111111-2222-3333-4444-555555555555"
    );
    expect(await screen.findByText(/Aucun candidat/i)).toBeInTheDocument();
    expect(screen.queryByText("Ana Diaz")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("does nothing if the user cancels the confirm dialog", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana", nom: "Diaz", blaze: null,
          email: "ana@example.com", telephone: "+594010101010",
          age: 25, socials: [], motivation: "x",
        },
      ],
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await screen.findByText("Ana Diaz");
    await user.click(screen.getByRole("button", { name: /Supprimer Ana Diaz/i }));

    expect(adminDeleteMock).not.toHaveBeenCalled();
    expect(screen.getByText("Ana Diaz")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("surfaces a delete error and keeps the row", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana", nom: "Diaz", blaze: null,
          email: "ana@example.com", telephone: "+594010101010",
          age: 25, socials: [], motivation: "x",
        },
      ],
    });
    adminDeleteMock.mockRejectedValue(new Error("Erreur serveur."));
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await screen.findByText("Ana Diaz");
    await user.click(screen.getByRole("button", { name: /Supprimer Ana Diaz/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erreur serveur.");
    expect(screen.getByText("Ana Diaz")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("renders every returned participant (no verified filter)", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "1", created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana", nom: "Diaz", blaze: null,
          email: "ana@example.com", telephone: "+594010101010",
          age: 25, socials: [], motivation: "x",
        },
        {
          id: "2", created_at: "2026-07-20T13:00:00Z",
          prenom: "Bob", nom: "Nom", blaze: null,
          email: "bob@example.com", telephone: "+594020202020",
          age: 30, socials: [], motivation: "y",
        },
      ],
    });

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "ok");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText(/Candidats \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText("Ana Diaz")).toBeInTheDocument();
    expect(screen.getByText("Bob Nom")).toBeInTheDocument();
  });
});
