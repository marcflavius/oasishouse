import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Verifier from "./Verifier";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return { ...actual, verify: vi.fn() };
});

const verifyMock = api.verify as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  verifyMock.mockReset();
});

function renderWith(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Verifier />
    </MemoryRouter>
  );
}

describe("<Verifier />", () => {
  it("shows the invalid message when no token is in the URL", async () => {
    renderWith("/verifier");
    expect(await screen.findByText(/Lien invalide ou expiré/i)).toBeInTheDocument();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("calls verify() with the token from the query string", async () => {
    verifyMock.mockResolvedValue({ status: "success" });
    renderWith("/verifier?token=abc123");
    await screen.findByText(/Candidature confirmée/i);
    expect(verifyMock).toHaveBeenCalledWith("abc123");
  });

  it("renders the already-verified message", async () => {
    verifyMock.mockResolvedValue({ status: "already" });
    renderWith("/verifier?token=t");
    expect(await screen.findByText(/Déjà confirmée/i)).toBeInTheDocument();
  });

  it("renders the invalid message for status=invalid", async () => {
    verifyMock.mockResolvedValue({ status: "invalid" });
    renderWith("/verifier?token=t");
    expect(await screen.findByText(/Lien invalide ou expiré/i)).toBeInTheDocument();
  });

  it("surfaces network errors", async () => {
    verifyMock.mockRejectedValue(new Error("boom"));
    renderWith("/verifier?token=t");
    await waitFor(() => {
      expect(screen.getByText(/^Erreur$/i)).toBeInTheDocument();
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });
});
