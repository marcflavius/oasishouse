import { useState, type FormEvent } from "react";
import { adminList, type Participant } from "../lib/api";

type State =
  | { kind: "locked" }
  | { kind: "loading" }
  | { kind: "ready"; participants: Participant[] }
  | { kind: "error"; message: string };

export default function Admin() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>({ kind: "locked" });
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const { participants } = await adminList(password);
      setState({ kind: "ready", participants });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  }

  if (state.kind !== "ready") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-white">Espace admin</h1>
        <p className="mt-2 text-slate-400">
          Entre le mot de passe pour voir la liste des candidats.
        </p>
        <form onSubmit={onLogin} className="mt-6 space-y-4">
          <input
            type="password"
            className="field-input"
            placeholder="Mot de passe"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={state.kind === "loading"}
          >
            {state.kind === "loading" ? "Connexion…" : "Se connecter"}
          </button>
          {state.kind === "error" && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.message}
            </p>
          )}
        </form>
      </main>
    );
  }

  const rows = showVerifiedOnly
    ? state.participants.filter((p) => p.verified)
    : state.participants;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Candidats ({rows.length})
          </h1>
          <p className="text-sm text-slate-400">
            {state.participants.filter((p) => p.verified).length} vérifiés
            sur {state.participants.length}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
          />
          Afficher uniquement les vérifiés
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.02] text-left text-xs font-semibold uppercase tracking-wider text-lagoon">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Âge</th>
              <th className="px-4 py-3">Réseaux</th>
              <th className="px-4 py-3">Vérifié</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((p) => (
              <tr key={p.id} className="align-top hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  {p.prenom} {p.nom}
                  {p.blaze && (
                    <div className="mt-0.5 text-xs font-normal italic text-lagoon">
                      « {p.blaze} »
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">{p.email}</td>
                <td className="px-4 py-3 text-slate-300">{p.telephone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{p.age ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.socials.length === 0 ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {p.socials.map((s) => (
                        <a
                          key={s.platform}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200 hover:bg-white/20"
                          title={s.url}
                        >
                          {s.platform}
                        </a>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.verified ? (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      Oui
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
                      En attente
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Aucun candidat pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
