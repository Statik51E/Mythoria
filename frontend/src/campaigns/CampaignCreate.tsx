import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { createCampaign } from "../lib/firestore";

export default function CampaignCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createCampaign(user.uid, name.trim(), description.trim());
      navigate(`/campaigns/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de création.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="font-mono text-[11px] tracking-label uppercase text-ink-400 hover:text-gold-400">
        ← Campagnes
      </Link>
      <div className="eyebrow mt-6 mb-3">02 / Forge · Nouvelle campagne</div>
      <h1 className="font-serif text-[40px] leading-[1.05] text-parchment m-0">
        Donne-lui un <em className="text-gold-400 italic">nom</em>.
      </h1>
      <p className="text-ink-300 text-[15px] mt-2 mb-10">
        Un titre de chapitre, un pitch en deux phrases. Tu pourras tout affiner plus tard.
      </p>

      <form onSubmit={submit} className="panel-gold p-8 space-y-6">
        <div>
          <div className="label mb-2">Titre</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Les marches de Velkrin"
            className="field font-serif text-[18px]"
            autoFocus
          />
        </div>
        <div>
          <div className="label mb-2">Pitch / synopsis</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Trois aventuriers, une auberge, un secret qui refuse de rester enterré..."
            className="field font-serif italic text-[15px] leading-relaxed resize-none"
          />
        </div>
        {error && <p className="text-ember text-[13px]">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={busy || !name.trim()} className="btn-primary">
            {busy ? "Création..." : "Allumer la lanterne"}
          </button>
          <Link to="/" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
