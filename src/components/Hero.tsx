export default function Hero() {
  return (
    <header className="relative overflow-hidden bg-deep text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-ocean/40 via-deep to-deep" />
      <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-lagoon">
          Télé-réalité
        </p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
          Oasis House <span className="text-coral">Caribbean</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-200">
          Le soleil, la mer, l'aventure… et toi&nbsp;? Inscris-toi au casting et
          tente ta chance pour devenir l'un des candidats de la nouvelle saison.
        </p>
        <a href="#inscription" className="btn-primary mt-8">
          Je m'inscris au casting
        </a>
      </div>
    </header>
  );
}
