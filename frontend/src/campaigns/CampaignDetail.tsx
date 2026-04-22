import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getCampaign, listSessions, createSession, listCharacters, createCharacter,
} from "../lib/firestore";
import type { Campaign, Character, SessionDoc } from "../lib/types";

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharName, setNewCharName] = useState("");
  const [newCharClass, setNewCharClass] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      setCampaign(await getCampaign(campaignId));
      setSessions(await listSessions(campaignId));
      setCharacters(await listCharacters(campaignId));
    })();
  }, [campaignId]);

  if (!campaign || !campaignId) {
    return <div className="eyebrow animate-pulse">Chargement...</div>;
  }
  const isHost = campaign.hostUid === user?.uid;

  async function startSession() {
    if (!campaignId) return;
    const id = await createSession(campaignId);
    navigate(`/campaigns/${campaignId}/sessions/${id}`);
  }

  async function addCharacter() {
    if (!user || !campaignId || !newCharName.trim()) return;
    await createCharacter(campaignId, user.uid, newCharName.trim(), newCharClass.trim() || "Aventurier");
    setNewCharName("");
    setNewCharClass("");
    setCharacters(await listCharacters(campaignId));
  }

  return (
    <div className="space-y-12">
      <div>
        <Link to="/" className="font-mono text-[11px] tracking-label uppercase text-ink-400 hover:text-gold-400">
          ← Campagnes
        </Link>
        <div className="flex items-start justify-between gap-6 mt-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="eyebrow">Campagne</div>
              {isHost && <span className="chip chip-gold">MJ</span>}
            </div>
            <h1 className="font-serif text-[48px] leading-[1.05] text-parchment m-0">{campaign.name}</h1>
            <p className="font-serif italic text-[17px] text-parchment-2 leading-relaxed mt-4">
              {campaign.description || "« Aucun pitch. L'histoire n'attend que ta plume. »"}
            </p>
          </div>
          <div className="panel p-4 min-w-[220px]">
            <div className="label mb-2">Code d'invitation</div>
            <div className="font-mono text-[24px] tracking-[0.3em] text-gold-400 text-center">
              {campaign.inviteCode}
            </div>
            <div className="label mt-3 text-center">
              {campaign.playerUids.length} joueur{campaign.playerUids.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow mb-2">Sessions</div>
            <h2 className="font-serif text-[26px] text-parchment m-0">À la table</h2>
          </div>
          {isHost && (
            <button onClick={startSession} className="btn-primary">+ Démarrer une session</button>
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="font-serif italic text-ink-400 text-[15px]">
            Aucune session ouverte. {isHost ? "À toi d'allumer la première." : "Attends que le MJ ouvre la table."}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/campaigns/${campaignId}/sessions/${s.id}`}
                  className="panel block px-5 py-4 flex items-center justify-between hover:border-hairline transition-colors group"
                >
                  <span className="font-serif text-[17px] text-parchment group-hover:text-gold-300 transition-colors">
                    Session du {s.startedAt?.toDate?.().toLocaleString?.("fr-FR") ?? "?"}
                  </span>
                  <span className="font-mono text-[11px] tracking-label uppercase text-gold-400">Entrer →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="eyebrow mb-2">Personnages</div>
        <h2 className="font-serif text-[26px] text-parchment m-0 mb-4">La compagnie</h2>

        {characters.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {characters.map((c) => (
              <li key={c.id} className="panel p-4 flex items-center justify-between">
                <div>
                  <div className="font-serif text-[18px] text-parchment">{c.name}</div>
                  <div className="font-mono text-[10px] tracking-label uppercase text-ink-400 mt-0.5">
                    {c.className} · niv. {c.level}
                  </div>
                </div>
                {c.ownerUid === user?.uid && <span className="chip chip-moss">Toi</span>}
              </li>
            ))}
          </ul>
        )}

        <div className="panel-gold p-5">
          <div className="label mb-3">Forger un personnage</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="Nom"
              className="field font-serif text-[16px] flex-1"
            />
            <input
              value={newCharClass}
              onChange={(e) => setNewCharClass(e.target.value)}
              placeholder="Classe (Paladin, Rôdeuse...)"
              className="field font-serif text-[16px] sm:w-64"
            />
            <button onClick={addCharacter} disabled={!newCharName.trim()} className="btn-primary">
              + Personnage
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
