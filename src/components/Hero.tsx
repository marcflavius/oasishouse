import { useState } from "react";

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  return (
    <header className="relative isolate overflow-hidden bg-abyss text-white">
      <picture>
        <source srcSet="/hero_oasishouse.avif" type="image/avif" />
        <source srcSet="/hero_oasishouse.webp" type="image/webp" />
        <img
          src="/hero_oasishouse.jpg"
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-abyss/50 via-midnight/40 to-abyss/70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-ocean/30 via-transparent to-coral/10" />

      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-lagoon drop-shadow">
          Télé-réalité — Guyane
        </p>
        <h1 className="text-4xl font-extrabold leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl">
          Oasis House{" "}
          <span className="bg-gradient-to-r from-coral to-sunset bg-clip-text text-transparent">
            Caribbean
          </span>
        </h1>
        <p className="mt-3 text-lg italic text-slate-200/90">
          Là où naissent les talents.
        </p>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-200/90">
          Créateurs de contenus, entrepreneurs, artistes, jeunes talents&nbsp;:
          rejoins la villa et révèle ton potentiel devant les caméras.
        </p>
        <a href="#inscription" className="btn-primary mt-8">
          Je m'inscris au casting
        </a>
        <p className="mt-4 text-sm text-lagoon">
          Date limite d'inscription&nbsp;: <strong>10 août 2026</strong>
        </p>
      </div>
    </header>
  );
}
