import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lagoon">
        Erreur 404
      </p>
      <h1 className="mt-3 bg-gradient-to-r from-coral to-sunset bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
        Page introuvable
      </h1>
      <p className="mt-4 text-slate-300">
        Cette page n'existe pas — ou elle a été emportée par la marée.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Retour à l'accueil
      </Link>
    </main>
  );
}
