import { useState, type FormEvent } from "react";
import Hero from "../components/Hero";
import OtpModal from "../components/OtpModal";
import SocialsPicker from "../components/SocialsPicker";
import { subscribe, type SubscribeInput } from "../lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "otp"; challenge: string; hmac: string; snapshot: SubscribeInput }
  | { kind: "success" }
  | { kind: "error"; message: string };

const EMPTY: SubscribeInput = {
  prenom: "",
  nom: "",
  blaze: "",
  email: "",
  telephone: "",
  age: "",
  motivation: "",
  socials: [],
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
    if (form.socials.length === 0) {
      setStatus({
        kind: "error",
        message: "Ajoute au moins un lien réseau social.",
      });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const res = await subscribe(form);
      setStatus({
        kind: "otp",
        challenge: res.challenge,
        hmac: res.hmac,
        snapshot: form,
      });
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

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          À propos de l'émission
        </h2>
        <div className="mt-4 space-y-4 text-slate-300">
          <p>
            <strong>OASIS HOUSE</strong>{" "}
            <em>(Là où naissent les talents)</em> est une émission de
            télé-réalité qui réunit dans une villa des créateurs de contenus,
            entrepreneurs, artistes et jeunes talents afin de valoriser leur
            potentiel, leur créativité et leur capacité à avoir un impact
            positif sur la société.
          </p>
          <p>
            À travers des défis, des projets collaboratifs, des actions
            solidaires et la création de contenus digitaux, les participants
            développent leurs compétences tout en mettant en lumière les
            richesses humaines, culturelles et associatives de la{" "}
            <strong>Guyane</strong>.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-coral/30 bg-coral/10 px-6 py-4 text-center backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-widest text-coral">
            Date limite d'inscription
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            10 août 2026
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-6 pb-24" id="inscription">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Formulaire d'inscription
        </h2>
        <p className="mt-2 text-slate-400">
          Remplis ce formulaire pour candidater. Tu recevras un code de
          confirmation par email à saisir dans une fenêtre pour finaliser ton
          inscription.
        </p>

        {status.kind === "success" ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-200 backdrop-blur">
            <h3 className="text-lg font-semibold text-emerald-100">Merci&nbsp;!</h3>
            <p className="mt-1">
              Ta candidature est confirmée. Nous te recontacterons prochainement
              pour la suite du casting.
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
              <label className="field-label" htmlFor="blaze">
                Blaze <span className="font-normal text-slate-400">(surnom)</span>
              </label>
              <input
                id="blaze"
                className="field-input"
                placeholder="Ton pseudo, surnom ou nom de scène"
                value={form.blaze}
                onChange={(e) => update("blaze", e.target.value)}
              />
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

            <SocialsPicker
              value={form.socials}
              onChange={(socials) => update("socials", socials)}
            />

            {status.kind === "error" && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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

      {status.kind === "otp" && (
        <OtpModal
          form={status.snapshot}
          initial={{ challenge: status.challenge, hmac: status.hmac }}
          onSuccess={() => {
            setStatus({ kind: "success" });
            setForm(EMPTY);
          }}
          onCancel={() => setStatus({ kind: "idle" })}
        />
      )}
    </>
  );
}
