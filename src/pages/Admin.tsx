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
        <h1 className="text-2xl font-bold text-slate-900">Espace admin</h1>
        <p className="mt-2 text-slate-600">
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
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <h1 className="text-2xl font-bold text-slate-900">
            Candidats ({rows.length})
          </h1>
          <p className="text-sm text-slate-600">
            {state.participants.filter((p) => p.verified).length} vérifiés
            sur {state.participants.length}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
          />
          Afficher uniquement les vérifiés
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Âge</th>
              <th className="px-4 py-3">Île</th>
              <th className="px-4 py-3">Vérifié</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {p.prenom} {p.nom}
                </td>
                <td className="px-4 py-3 text-slate-700">{p.email}</td>
                <td className="px-4 py-3 text-slate-700">{p.telephone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{p.age ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{p.ile ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.verified ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Oui
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
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
