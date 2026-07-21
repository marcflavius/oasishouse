import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Admin from "./Admin";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return { ...actual, adminList: vi.fn() };
});

const adminListMock = api.adminList as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  adminListMock.mockReset();
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
          verified: true,
          verified_at: "2026-07-20T12:05:00Z",
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
    // The admin table header renders as "Candidats (N)" — differ from the
    // "voir la liste des candidats" copy on the locked screen.
    expect(screen.queryByText(/Candidats \(/)).not.toBeInTheDocument();
  });

  it("filters to verified-only when the checkbox is ticked", async () => {
    const user = userEvent.setup({ delay: null });
    adminListMock.mockResolvedValue({
      participants: [
        {
          id: "1", created_at: "2026-07-20T12:00:00Z",
          prenom: "Ana", nom: "Diaz", blaze: null,
          email: "ana@example.com", telephone: "+594010101010",
          age: 25, socials: [], motivation: "x",
          verified: true, verified_at: "2026-07-20T12:05:00Z",
        },
        {
          id: "2", created_at: "2026-07-20T13:00:00Z",
          prenom: "Bob", nom: "Nom", blaze: null,
          email: "bob@example.com", telephone: "+594020202020",
          age: 30, socials: [], motivation: "y",
          verified: false, verified_at: null,
        },
      ],
    });

    render(<Admin />);
    await user.type(screen.getByPlaceholderText(/Mot de passe/i), "ok");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));
    await screen.findByText("Ana Diaz");
    expect(screen.getByText("Bob Nom")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Afficher uniquement les vérifiés/i));

    expect(screen.getByText("Ana Diaz")).toBeInTheDocument();
    expect(screen.queryByText("Bob Nom")).not.toBeInTheDocument();
  });
});
