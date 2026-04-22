import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getCampaign, listSessions, createSession, watchCharacters, createCharacter,
} from "../lib/firestore";
import { buildPortraitUrl } from "../lib/portrait";
import type { Campaign, Character, SessionDoc } from "../lib/types";
import CharacterForge from "../sessions/CharacterForge";
import CharacterPortrait from "../sessions/CharacterPortrait";

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showForge, setShowForge] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      setCampaign(await getCampaign(campaignId));
      setSessions(await listSessions(campaignId));
    })();
    return watchCharacters(campaignId, setCharacters);
  }, [campaignId]);

  const myCharacter = useMemo(
    () => characters.find((c) => c.ownerUid === user?.uid) ?? null,
    [characters, user?.uid]
  );

  if (!campaign || !campaignId) {
    return <div className="eyebrow animate-pulse">Chargement...</div>;
  }
  const isHost = campaign.hostUid === user?.uid;

  async function startSession() {
    if (!campaignId) return;
    const id = await createSession(campaignId);
    navigate(`/campaigns/${campaignId}/sessions/${id}`);
  }

  async function handleForge(data: Omit<Character, "id">) {
    if (!campaignId) return;
    await createCharacter(campaignId, data);
    setShowForge(false);
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
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow mb-2">Personnages</div>
            <h2 className="font-serif text-[26px] text-parchment m-0">La compagnie</h2>
          </div>
          {!myCharacter && (
            <button onClick={() => setShowForge(true)} className="btn-primary">+ Forger mon personnage</button>
          )}
        </div>

        {characters.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} mine={c.ownerUid === user?.uid} />
            ))}
          </ul>
        ) : (
          <p className="font-serif italic text-ink-400 text-[15px]">
            Aucun héros encore. Forge le tien pour ouvrir le chapitre.
          </p>
        )}
      </section>

      {showForge && user && (
        <CharacterForge
          ownerUid={user.uid}
          onCreate={handleForge}
          onClose={() => setShowForge(false)}
          dismissible={true}
        />
      )}
    </div>
  );
}

function CharacterCard({ character, mine }: { character: Character; mine: boolean }) {
  const initials = character.name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portraitUrl = character.portraitSeed
    ? buildPortraitUrl(
        {
          race: character.race,
          classId: character.classId,
          appearance: character.appearance,
          name: character.name,
        },
        character.portraitSeed,
        192
      )
    : null;

  return (
    <li className="panel p-4 flex items-center gap-4">
      {portraitUrl ? (
        <CharacterPortrait
          src={portraitUrl}
          alt={character.name}
          size={64}
          rounded="md"
          fallbackInitials={initials}
        />
      ) : (
        <div
          className="w-16 h-16 rounded-sm border border-hairline-strong flex items-center justify-center font-serif text-[22px] text-parchment shrink-0"
          style={{ background: "linear-gradient(135deg, #2a2219, #191210)" }}
        >
          {initials || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="font-serif text-[18px] text-parchment truncate">{character.name}</div>
          {mine && <span className="chip chip-moss text-[9px]">Toi</span>}
        </div>
        <div className="font-mono text-[10px] tracking-label uppercase text-ink-400">
          {character.className} · niv. {character.level}
        </div>
      </div>
    </li>
  );
}
