import { useState, FormEvent } from "react";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await signUpEmail(email, password, displayName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 grain">
      <div className="w-full max-w-md fade-in">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="sigil" />
          <div>
            <h1 className="font-serif text-[26px] leading-none text-parchment m-0">
              Mythor<em className="italic text-gold-400">i</em>a
            </h1>
            <div className="eyebrow mt-1">
              {mode === "signin" ? "Retour à la table" : "Nouvelle aventure"}
            </div>
          </div>
        </div>

        <div className="panel-gold p-8 shadow-panel">
          <h2 className="font-serif text-[28px] leading-[1.1] text-parchment mb-1">
            {mode === "signin" ? "Reprends ta place." : "Forge un compte d'aventurier."}
          </h2>
          <p className="text-ink-300 text-[13px] mb-6">
            {mode === "signin"
              ? "Email et mot de passe suffisent. Tes campagnes t'attendent."
              : "Choisis un nom — il apparaîtra au-dessus de ton jeton sur la carte."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <div className="label mb-1.5">Nom d'aventurier</div>
                <input
                  className="field"
                  placeholder="Kael, Lyra, Thorn..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={40}
                />
              </div>
            )}
            <div>
              <div className="label mb-1.5">Email</div>
              <input
                type="email"
                className="field"
                placeholder="toi@domaine.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="label mb-1.5">Mot de passe</div>
              <input
                type="password"
                className="field"
                placeholder="6 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-[13px] text-ember">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
              {busy ? "..." : mode === "signin" ? "Entrer" : "Créer le compte"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 hr-gold" />
            <span className="font-mono text-[10px] tracking-label uppercase text-ink-400">ou</span>
            <div className="flex-1 hr-gold" />
          </div>

          <button
            onClick={() => signInGoogle().catch((e) => setError(e.message))}
            className="btn-ghost w-full"
          >
            Continuer avec Google
          </button>
        </div>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-6 font-mono text-[11px] tracking-label uppercase text-ink-400 hover:text-gold-400 transition-colors"
        >
          {mode === "signin" ? "Pas de compte ? · Inscris-toi" : "Déjà un compte ? · Connecte-toi"}
        </button>
      </div>
    </div>
  );
}
