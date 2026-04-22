import { useState, FormEvent } from "react";

interface Props {
  onCreate: (name: string, className: string) => Promise<void>;
  onClose?: () => void;
  dismissible?: boolean;
}

export default function CharacterForge({ onCreate, onClose, dismissible = false }: Props) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim(), className.trim() || "Aventurier");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forge ratée.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm fade-in">
      <form
        onSubmit={submit}
        className="panel-gold p-8 w-[min(90vw,480px)] space-y-5 shadow-panel"
      >
        <div>
          <div className="eyebrow mb-2">Forge</div>
          <h2 className="font-serif text-[28px] text-parchment m-0">
            Ton <em className="text-gold-400 italic">personnage</em>.
          </h2>
          <p className="font-serif italic text-ink-300 text-[14px] mt-2">
            Avant d'entrer dans la lumière de la lanterne, donne un nom et un visage à ton aventurier.
          </p>
        </div>

        <div>
          <div className="label mb-2">Nom</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder="Elara la Silencieuse"
            className="field font-serif text-[18px] w-full"
            autoFocus
          />
        </div>

        <div>
          <div className="label mb-2">Classe</div>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            maxLength={30}
            placeholder="Rôdeuse, Paladin, Mage..."
            className="field font-serif text-[16px] w-full"
          />
        </div>

        {error && <p className="text-ember text-[13px]">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className="btn-primary flex-1"
          >
            {busy ? "Forge en cours..." : "Forger"}
          </button>
          {dismissible && onClose && (
            <button type="button" onClick={onClose} className="btn-ghost">
              Plus tard
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
