import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import SocialsPicker, { type SocialLink } from "./SocialsPicker";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof api>("../lib/api");
  return { ...actual, checkSocial: vi.fn() };
});

const checkSocialMock = api.checkSocial as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Default: URL exists — so existing "happy path" tests don't need per-test setup.
  checkSocialMock.mockResolvedValue({ ok: true, exists: true, status: 200 });
});

function Wrapper({ initial = [] as SocialLink[] }: { initial?: SocialLink[] }) {
  const [value, setValue] = useState<SocialLink[]>(initial);
  return <SocialsPicker value={value} onChange={setValue} />;
}

describe("<SocialsPicker />", () => {
  it("renders one button per platform", () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/Ajouter Instagram/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter TikTok/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter YouTube/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter X/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter Facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter Twitch/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ajouter Snapchat/i)).toBeInTheDocument();
  });

  it("shows the empty-pool hint when no link is added", () => {
    render(<Wrapper />);
    expect(screen.getByText(/pool est vide/i)).toBeInTheDocument();
  });

  it("adds a valid link to the pool after Enter", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Wrapper />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    const input = await screen.findByPlaceholderText("tonpseudo");
    await user.type(input, "ana{Enter}");

    // pool now shows the "retirer" remove button for the added link
    expect(screen.getByLabelText(/Retirer Instagram/i)).toBeInTheDocument();
    // empty-pool hint is gone
    expect(screen.queryByText(/pool est vide/i)).not.toBeInTheDocument();
  });

  it("shows a validation error for an invalid handle and does not add it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Wrapper />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    const input = await screen.findByPlaceholderText("tonpseudo");
    // Spaces aren't allowed in Instagram handles.
    await user.type(input, "hi there{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Pseudo Instagram invalide/i
    );
    expect(screen.queryByLabelText(/Retirer Instagram/i)).not.toBeInTheDocument();
  });

  it("removes a link from the pool when its × is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <Wrapper
        initial={[{ platform: "instagram", url: "https://instagram.com/ana" }]}
      />
    );

    await user.click(screen.getByLabelText(/Retirer Instagram/i));

    expect(screen.queryByLabelText(/Retirer Instagram/i)).not.toBeInTheDocument();
    expect(screen.getByText(/pool est vide/i)).toBeInTheDocument();
  });

  it("clicking Annuler closes the editor without adding", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Wrapper />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    await user.type(
      await screen.findByPlaceholderText("tonpseudo"),
      "instagram.com/ana"
    );
    await user.click(screen.getByRole("button", { name: /Annuler/i }));

    expect(
      screen.queryByPlaceholderText("tonpseudo")
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Retirer Instagram/i)).not.toBeInTheDocument();
  });

  it("rejects a handle when the existence check returns exists=false", async () => {
    const user = userEvent.setup({ delay: null });
    checkSocialMock.mockResolvedValue({ ok: true, exists: false, status: 404 });
    render(<Wrapper />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    await user.type(await screen.findByPlaceholderText("tonpseudo"), "ana{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Ce compte Instagram est introuvable/i
    );
    expect(screen.queryByLabelText(/Retirer Instagram/i)).not.toBeInTheDocument();
    expect(checkSocialMock).toHaveBeenCalledWith("https://instagram.com/ana");
  });

  it("accepts the handle when the existence check throws (fail-open)", async () => {
    const user = userEvent.setup({ delay: null });
    checkSocialMock.mockRejectedValue(new Error("network down"));
    render(<Wrapper />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    await user.type(await screen.findByPlaceholderText("tonpseudo"), "ana{Enter}");

    expect(await screen.findByLabelText(/Retirer Instagram/i)).toBeInTheDocument();
  });

  it("propagates onChange with the full pool", async () => {
    const user = userEvent.setup({ delay: null });
    const onChange = vi.fn();
    render(<SocialsPicker value={[]} onChange={onChange} />);

    await user.click(screen.getByLabelText(/Ajouter Instagram/i));
    await user.type(
      await screen.findByPlaceholderText("tonpseudo"),
      "instagram.com/ana{Enter}"
    );

    expect(onChange).toHaveBeenCalledWith([
      { platform: "instagram", url: "https://instagram.com/ana" },
    ]);
  });
});
