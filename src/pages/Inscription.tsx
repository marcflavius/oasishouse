import { useState, type FormEvent } from "react";
import Hero from "../components/Hero";
import { subscribe, type SubscribeInput } from "../lib/api";

const ILES = [
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "Saint-Martin",
  "Saint-Barthélemy",
  "Haïti",
  "République dominicaine",
  "Autre",
];

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const EMPTY: SubscribeInput = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  ile: "",
  age: "",
  motivation: "",
  hp: "",
};

export default function Inscription() {
  const [form, setForm] = useState<SubscribeInput>(EMPTY);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function update<K extends keyof SubscribeInput>(key: K, value: SubscribeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    try {
      await subscribe(form);
      setStatus({ kind: "success" });
      setForm(EMPTY);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  }

  return (
    <>
      <Hero />

      <main className="mx-auto max-w-2xl px-6 py-16" id="inscription">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Formulaire d'inscription
        </h2>
        <p className="mt-2 text-slate-600">
          Remplis ce formulaire pour candidater. Tu recevras un email de
          confirmation à valider pour finaliser ton inscription.
        </p>

        {status.kind === "success" ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <h3 className="text-lg font-semibold">Merci&nbsp;!</h3>
            <p className="mt-1">
              Un email de confirmation vient de t'être envoyé. Clique sur le
              lien pour valider ta candidature.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {/* Honeypot — hidden from humans, catches bots */}
            <div className="hidden" aria-hidden="true">
              <label>
                Ne pas remplir
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.hp}
                  onChange={(e) => update("hp", e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="prenom">
                  Prénom
                </label>
                <input
                  id="prenom"
                  className="field-input"
                  required
                  value={form.prenom}
                  onChange={(e) => update("prenom", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="nom">
                  Nom
                </label>
                <input
                  id="nom"
                  className="field-input"
                  required
                  value={form.nom}
                  onChange={(e) => update("nom", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="field-input"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="telephone">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  type="tel"
                  className="field-input"
                  required
                  placeholder="+590…"
                  value={form.telephone}
                  onChange={(e) => update("telephone", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="age">
                  Âge
                </label>
                <input
                  id="age"
                  type="number"
                  min={18}
                  max={99}
                  className="field-input"
                  required
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="ile">
                Île / Territoire
              </label>
              <select
                id="ile"
                className="field-input"
                required
                value={form.ile}
                onChange={(e) => update("ile", e.target.value)}
              >
                <option value="" disabled>
                  Choisis…
                </option>
                {ILES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="motivation">
                Pourquoi veux-tu participer&nbsp;?
              </label>
              <textarea
                id="motivation"
                rows={4}
                className="field-input"
                required
                value={form.motivation}
                onChange={(e) => update("motivation", e.target.value)}
              />
            </div>

            {status.kind === "error" && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {status.message}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={status.kind === "loading"}
            >
              {status.kind === "loading" ? "Envoi…" : "Envoyer ma candidature"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
