import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verify, type VerifyStatus } from "../lib/api";

type State =
  | { kind: "loading" }
  | { kind: "done"; status: VerifyStatus }
  | { kind: "error"; message: string };

export default function Verifier() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "done", status: "invalid" });
      return;
    }
    verify(token)
      .then((r) => setState({ kind: "done", status: r.status }))
      .catch((err: unknown) =>
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Erreur inconnue.",
        })
      );
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      {state.kind === "loading" && (
        <p className="text-slate-600">Vérification en cours…</p>
      )}

      {state.kind === "done" && state.status === "success" && (
        <>
          <h1 className="text-3xl font-extrabold text-emerald-700">
            Candidature confirmée&nbsp;!
          </h1>
          <p className="mt-3 text-slate-700">
            Ton adresse est vérifiée. Nous te recontacterons prochainement pour
            la suite du casting.
          </p>
        </>
      )}

      {state.kind === "done" && state.status === "already" && (
        <>
          <h1 className="text-3xl font-extrabold text-ocean">
            Déjà confirmée
          </h1>
          <p className="mt-3 text-slate-700">
            Cette candidature a déjà été vérifiée. À bientôt&nbsp;!
          </p>
        </>
      )}

      {state.kind === "done" && state.status === "invalid" && (
        <>
          <h1 className="text-3xl font-extrabold text-red-700">
            Lien invalide ou expiré
          </h1>
          <p className="mt-3 text-slate-700">
            Ce lien de vérification n'est plus valide. Réinscris-toi pour
            recevoir un nouveau lien.
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1 className="text-3xl font-extrabold text-red-700">Erreur</h1>
          <p className="mt-3 text-slate-700">{state.message}</p>
        </>
      )}

      <Link to="/" className="btn-primary mt-8">
        Retour à l'accueil
      </Link>
    </main>
  );
}
