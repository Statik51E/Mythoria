import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { watchMyCampaigns } from "../lib/firestore";
import { apiPost } from "../lib/apiClient";
import type { Campaign } from "../lib/types";

export default function CampaignList() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchMyCampaigns(user.uid, setCampaigns);
  }, [user]);

  async function join() {
    setJoinError(null);
    setJoining(true);
    try {
      await apiPost<{ campaignId: string; alreadyMember: boolean }>("/api/join", { inviteCode: code });
      setCode("");
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Code invalide.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow mb-3">01 / Hub · Campagnes</div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-serif text-[44px] leading-[1.05] text-parchment m-0">
              Tes <em className="text-gold-400 italic">campagnes</em>.
            </h1>
            <p className="text-ink-300 text-[15px] mt-2 max-w-lg">
              Ouvre une table existante, rejoins-en une avec un code, ou forge une nouvelle histoire.
            </p>
          </div>
          <Link to="/campaigns/new" className="btn-primary">+ Nouvelle campagne</Link>
        </div>
      </div>

      <div className="panel-gold p-6">
        <div className="eyebrow mb-3">Rejoindre via code</div>
        <div className="flex gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="field flex-1 font-mono uppercase tracking-[0.3em] text-center text-[15px]"
            maxLength={6}
          />
          <button onClick={join} disabled={!code || joining} className="btn-ghost">
            {joining ? "..." : "Rejoindre"}
          </button>
        </div>
        {joinError && <p className="text-ember text-[13px] mt-2">{joinError}</p>}
      </div>

      {campaigns.length === 0 ? (
        <div className="panel p-16 text-center">
          <div className="eyebrow mb-3">Page blanche</div>
          <p className="font-serif italic text-[20px] text-parchment-2 leading-relaxed max-w-md mx-auto">
            « Aucune campagne encore. Le premier feu de veillée n'attend que toi. »
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const isHost = c.hostUid === user?.uid;
            return (
              <li key={c.id}>
                <Link
                  to={`/campaigns/${c.id}`}
                  className="panel block p-6 hover:border-hairline transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-serif text-[22px] text-parchment group-hover:text-gold-300 transition-colors m-0">
                      {c.name}
                    </h3>
                    {isHost && <span className="chip chip-gold">MJ</span>}
                  </div>
                  <p className="text-ink-300 text-[13px] line-clamp-2 mb-4 min-h-[2.6em]">
                    {c.description || "— Pas de synopsis —"}
                  </p>
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-label uppercase text-ink-400">
                    <span>
                      {c.playerUids.length} joueur{c.playerUids.length > 1 ? "s" : ""}
                    </span>
                    <span>Code · <span className="text-gold-500">{c.inviteCode}</span></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
