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
