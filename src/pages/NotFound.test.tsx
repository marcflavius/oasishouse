import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./NotFound";

describe("<NotFound />", () => {
  it("renders the 404 headline", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText(/Erreur 404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page introuvable/i)).toBeInTheDocument();
  });

  it("links back to the home page", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Retour à l'accueil/i })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
