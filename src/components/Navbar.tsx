import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavLink {
  // Empty string = navigate to a route (no anchor); otherwise the hash on `/`.
  hash: string;
  // Route this link's anchor lives on. All anchors currently live on `/`.
  route: string;
  label: string;
  cta?: boolean;
}

const LINKS: NavLink[] = [
  { hash: "concept", route: "/", label: "Concept" },
  { hash: "recompenses", route: "/", label: "Récompenses" },
  { hash: "intro", route: "/villa", label: "La Villa" },
  { hash: "inscription", route: "/", label: "Inscription", cta: true },
];

// Renders an <a> for same-page anchors (native smooth scroll), a react-router
// <Link> for cross-page navigation (with hash if needed).
function NavItem({
  link,
  onNavigate,
  className,
}: {
  link: NavLink;
  onNavigate?: () => void;
  className: string;
}) {
  const { pathname } = useLocation();
  const samePage = pathname === link.route;
  const hasHash = link.hash !== "";

  if (samePage && hasHash) {
    // Same page + anchor: use plain <a> for native smooth scroll.
    return (
      <a href={`#${link.hash}`} onClick={onNavigate} className={className}>
        {link.label}
      </a>
    );
  }

  // Cross-page: react-router Link. Includes the hash if any — <ScrollToHash>
  // in main.tsx handles the scroll after the route mounts.
  return (
    <Link
      to={`${link.route}${hasHash ? `#${link.hash}` : ""}`}
      onClick={onNavigate}
      className={className}
    >
      {link.label}
    </Link>
  );
}

// Anchor-based nav. Uses native `href="#id"` scrolling — smooth scroll is
// enabled globally via `scroll-behavior: smooth` on <html> in index.css.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const desktopClass = (l: NavLink) =>
    l.cta
      ? "rounded-full bg-coral px-3 py-1.5 text-white shadow transition hover:brightness-110"
      : "rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white";

  const mobileClass = (l: NavLink) =>
    `block px-4 py-2.5 text-sm font-semibold transition ${
      l.cta
        ? "text-coral hover:bg-coral/15"
        : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 transition ${
        scrolled
          ? "border-b border-white/10 bg-abyss/70 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-sm font-extrabold uppercase tracking-[0.2em] text-white"
        >
          Oasis House{" "}
          <span className="bg-gradient-to-r from-coral to-sunset bg-clip-text text-transparent">
            Caribbean
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 text-sm font-semibold text-slate-200 sm:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <NavItem link={l} className={desktopClass(l)} />
            </li>
          ))}
        </ul>

        {/* Mobile 3-dots dropdown */}
        <div className="relative sm:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>

          {menuOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-12 w-52 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-abyss/95 py-1 shadow-2xl backdrop-blur-lg"
            >
              {LINKS.map((l) => (
                <li key={l.label} role="none">
                  <NavItem
                    link={l}
                    onNavigate={() => setMenuOpen(false)}
                    className={mobileClass(l)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
