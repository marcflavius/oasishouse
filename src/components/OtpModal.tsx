import { useEffect, useRef, useState } from "react";
import { subscribe, verifyOtp, type SubscribeInput } from "../lib/api";

interface Props {
  form: SubscribeInput;
  initial: { challenge: string; hmac: string };
  onSuccess: () => void;
  onCancel: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "resending" }
  | { kind: "error"; message: string };

const RESEND_COOLDOWN_SEC = 60;

export default function OtpModal({ form, initial, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [challenge, setChallenge] = useState(initial);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setStatus({ kind: "verifying" });
    try {
      await verifyOtp(challenge.challenge, challenge.hmac, code, form);
      onSuccess();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      });
      setCode("");
      inputRef.current?.focus();
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setStatus({ kind: "resending" });
    try {
      const next = await subscribe(form);
      setChallenge({ challenge: next.challenge, hmac: next.hmac });
      setCooldown(RESEND_COOLDOWN_SEC);
      setStatus({ kind: "idle" });
      setCode("");
      inputRef.current?.focus();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  }

  const busy = status.kind === "verifying" || status.kind === "resending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 px-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-title"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-midnight/95 p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="otp-title" className="text-xl font-bold text-white sm:text-2xl">
          Confirme ton email
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Nous avons envoyé un code à 6 chiffres à{" "}
          <strong className="text-lagoon">{form.email}</strong>. Saisis-le
          ci-dessous pour finaliser ton inscription.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="field-input text-center text-2xl font-semibold tracking-[0.5em] sm:text-3xl"
            placeholder="••••••"
            aria-label="Code à 6 chiffres"
            disabled={busy}
          />

          {status.kind === "error" && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {status.message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || code.length !== 6}
          >
            {status.kind === "verifying" ? "Vérification…" : "Valider mon code"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || busy}
            className="text-lagoon transition hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {status.kind === "resending"
              ? "Envoi…"
              : cooldown > 0
              ? `Renvoyer un code (${cooldown}s)`
              : "Renvoyer un code"}
          </button>
          <span className="text-slate-500">Le code expire dans 15 min</span>
        </div>
      </div>
    </div>
  );
}
