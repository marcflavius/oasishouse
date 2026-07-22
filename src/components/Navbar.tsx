import { useEffect, useState } from "react";

// Anchor-based nav. Uses native `href="#id"` scrolling — smooth scroll is
// enabled globally via `scroll-behavior: smooth` on <html> in index.css.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 transition ${
        scrolled
          ? "border-b border-white/10 bg-abyss/70 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a
          href="#top"
          className="text-sm font-extrabold uppercase tracking-[0.2em] text-white"
        >
          Oasis House{" "}
          <span className="bg-gradient-to-r from-coral to-sunset bg-clip-text text-transparent">
            Caribbean
          </span>
        </a>
        <ul className="flex items-center gap-1 text-sm font-semibold text-slate-200">
          <li>
            <a
              href="#concept"
              className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
            >
              Concept
            </a>
          </li>
          <li>
            <a
              href="#inscription"
              className="rounded-full bg-coral px-3 py-1.5 text-white shadow transition hover:brightness-110"
            >
              Inscription
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
