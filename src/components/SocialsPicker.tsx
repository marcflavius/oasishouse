import { useRef, useState, type KeyboardEvent } from "react";

export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "facebook"
  | "twitch"
  | "snapchat";

export type SocialLink = { platform: Platform; url: string };

interface PlatformDef {
  key: Platform;
  label: string;
  color: string;
  hint: string;
  // Regex the pasted URL must match. Applied AFTER auto-prefixing https:// if missing.
  pattern: RegExp;
  // When true, the icon asset is a complete circular logo (bg + glyph baked in)
  // and should fill its container instead of being placed on a brand-colored disc.
  prerendered?: boolean;
}

const PLATFORMS: PlatformDef[] = [
  {
    key: "instagram", label: "Instagram", color: "#E4405F", hint: "instagram.com/tonpseudo",
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?/i,
  },
  {
    key: "tiktok", label: "TikTok", color: "#000000", hint: "tiktok.com/@tonpseudo", prerendered: true,
    pattern: /^https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/(@?[A-Za-z0-9._-]+)\/?/i,
  },
  {
    key: "youtube", label: "YouTube", color: "#FF0000", hint: "youtube.com/@tachaine",
    pattern: /^https?:\/\/(www\.|m\.)?(youtube\.com\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+|user\/[A-Za-z0-9._-]+)|youtu\.be\/[A-Za-z0-9_-]+)\/?/i,
  },
  {
    key: "twitter", label: "X", color: "#0f172a", hint: "x.com/tonpseudo",
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}\/?/i,
  },
  {
    key: "facebook", label: "Facebook", color: "#1877F2", hint: "facebook.com/tonpseudo",
    pattern: /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9.\-_/]+\/?/i,
  },
  {
    key: "twitch", label: "Twitch", color: "#9146FF", hint: "twitch.tv/tonpseudo",
    pattern: /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]+\/?/i,
  },
  {
    key: "snapchat", label: "Snapchat", color: "#FFCC00", hint: "snapchat.com/add/tonpseudo",
    pattern: /^https?:\/\/(www\.)?snapchat\.com\/(add|t|@)\/?[A-Za-z0-9._-]+\/?/i,
  },
];

const DEFS: Record<Platform, PlatformDef> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p])
) as Record<Platform, PlatformDef>;

function Glyph({ platform, className }: { platform: Platform; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
    focusable: false as const,
  };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      // Prerendered circular logo — always fills its container.
      return (
        <img
          src="/tiktok-logo.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full rounded-full object-cover"
        />
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M22 8s-.2-1.5-.8-2.1c-.7-.7-1.5-.7-1.9-.8C16.5 5 12 5 12 5s-4.5 0-7.3.2c-.4 0-1.2 0-1.9.7C2.2 6.5 2 8 2 8s-.2 1.7-.2 3.5v1c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.7.7 1.7.7 2.1.8 1.5.2 6.1.2 6.1.2s4.5 0 7.3-.2c.4 0 1.2 0 1.9-.8.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1c0-1.8-.2-3.5-.2-3.5zM10 15V9l5 3-5 3z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common} fill="currentColor">
          <path d="M17.5 3H21l-6.7 7.6L22 21h-6l-4.6-6.1L6 21H2.5l7.2-8.2L2 3h6l4.2 5.6L17.5 3z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M22 12a10 10 0 10-11.6 9.9v-7H8V12h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" />
        </svg>
      );
    case "twitch":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4 3l-1.5 4v11h4v3l3-3h4l5-5V3H4zm14 9l-3 3h-3l-3 3v-3H6V5h12v7zm-4-5h1.5v4H14V7zm-4 0h1.5v4H10V7z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 3c2.8 0 4.7 1.9 4.7 4.7 0 1 .1 2 .3 2.9.1.4.4.6.8.7.4.1.9.1 1.3 0 .2 0 .5.1.5.4 0 .3-.2.5-.5.6-.6.2-1.4.4-1.7.9-.2.3-.1.7 0 1 .5 1.3 1.6 2.2 3 2.5.3.1.5.3.5.6 0 .3-.3.5-.6.5-.7.1-1.5 0-2.1.3-.5.2-.6.7-.7 1.2 0 .3-.3.5-.6.5-.5 0-1-.1-1.5-.2-.5 0-1 .1-1.4.3-.9.4-1.7 1-2.6 1.2-.9-.2-1.7-.8-2.6-1.2-.4-.2-.9-.3-1.4-.3-.5.1-1 .2-1.5.2-.3 0-.6-.2-.6-.5-.1-.5-.2-1-.7-1.2-.6-.3-1.4-.2-2.1-.3-.3 0-.6-.2-.6-.5 0-.3.2-.5.5-.6 1.4-.3 2.5-1.2 3-2.5.1-.3.2-.7 0-1-.3-.5-1.1-.7-1.7-.9-.3-.1-.5-.3-.5-.6 0-.3.3-.4.5-.4.4.1.9.1 1.3 0 .4-.1.7-.3.8-.7.2-.9.3-1.9.3-2.9C7.3 4.9 9.2 3 12 3z" />
        </svg>
      );
  }
}

function shortLabel(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    return path ? `@${path.split("/").pop()}` : u.hostname;
  } catch {
    return url;
  }
}

interface Props {
  value: SocialLink[];
  onChange: (value: SocialLink[]) => void;
}

export default function SocialsPicker({ value, onChange }: Props) {
  const [active, setActive] = useState<Platform | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const used = new Set(value.map((v) => v.platform));

  function openPlatform(p: Platform) {
    setActive(p);
    setError(null);
    setDraft(value.find((v) => v.platform === p)?.url ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancel() {
    setActive(null);
    setDraft("");
    setError(null);
  }

  function commit() {
    if (!active) return;
    let url = draft.trim();
    if (!url) {
      cancel();
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const def = DEFS[active];
    if (!def.pattern.test(url)) {
      setError(`Lien ${def.label} invalide. Exemple : https://${def.hint}`);
      return;
    }

    const next = value.filter((v) => v.platform !== active);
    next.push({ platform: active, url });
    onChange(next);
    cancel();
  }

  function remove(p: Platform) {
    onChange(value.filter((v) => v.platform !== p));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      cancel();
    }
  }

  return (
    <div>
      <label className="field-label">
        Liens réseaux sociaux <span className="text-coral">*</span>
      </label>
      <p className="mt-1 text-sm text-slate-400">
        Clique sur une icône pour ajouter au moins un lien. Il rejoint ton pool
        ci-dessous.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const isUsed = used.has(p.key);
          const isActive = active === p.key;
          // X is always rendered in its canonical dark-bg / white-glyph look —
          // a dark glyph on the neutral idle bg is invisible.
          const alwaysBrand = p.key === "twitter";
          const filled = isUsed || isActive || alwaysBrand;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => (isActive ? cancel() : openPlatform(p.key))}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isActive
                  ? "scale-110 border-white/40 shadow-lg"
                  : isUsed
                    ? "border-white/20"
                    : "border-white/10 hover:border-white/30 hover:scale-105"
              }`}
              style={{
                backgroundColor: p.prerendered
                  ? "transparent"
                  : filled
                    ? p.color
                    : "rgba(255,255,255,0.06)",
                color: filled ? "#fff" : p.color,
              }}
              aria-label={isUsed ? `Modifier ${p.label}` : `Ajouter ${p.label}`}
              title={p.label}
            >
              <Glyph platform={p.key} className="h-5 w-5" />
              {isUsed && !isActive && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-emerald-950 shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
              style={{
                backgroundColor: DEFS[active].prerendered ? "transparent" : DEFS[active].color,
              }}
            >
              <Glyph platform={active} className="h-4 w-4" />
            </span>
            <input
              ref={inputRef}
              type="url"
              inputMode="url"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={onKey}
              placeholder={`https://${DEFS[active].hint}`}
              aria-invalid={error ? true : undefined}
              className={`field-input flex-1 min-w-[200px] ${
                error ? "!border-red-400/60 !ring-red-400/30" : ""
              }`}
            />
            <button type="button" onClick={commit} className="btn-primary !py-2 !px-4 text-sm">
              Ajouter
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-full px-3 py-2 text-sm text-slate-400 hover:text-white"
            >
              Annuler
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <div
        className={`mt-4 min-h-[88px] rounded-2xl border p-4 backdrop-blur transition ${
          value.length === 0
            ? "border-dashed border-white/15 bg-lagoon/5"
            : "border-white/10 bg-lagoon/10"
        }`}
        aria-label="Ton pool de réseaux sociaux"
      >
        {value.length === 0 ? (
          <p className="text-center text-sm italic text-slate-400">
            Ton pool est vide. Plonge tes liens ici ↑
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {value.map((link) => {
              const def = DEFS[link.platform];
              return (
                <li
                  key={link.platform}
                  className="group flex items-center gap-1 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-1.5 text-white shadow-sm transition hover:bg-white/15"
                  title={link.url}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-white"
                    style={{ backgroundColor: def.prerendered ? "transparent" : def.color }}
                  >
                    <Glyph platform={link.platform} className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(link.platform)}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/20 hover:text-white"
                    aria-label={`Retirer ${def.label}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
