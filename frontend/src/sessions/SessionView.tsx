import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getCampaign,
  watchMessages,
  postMessage,
  listCharacters,
  createCharacter,
} from "../lib/firestore";
import { callGroq, GroqMessage } from "../lib/groqClient";
import type { Campaign, Character, Message } from "../lib/types";
import NarrationPanel, { QuickAction } from "./NarrationPanel";
import PlayerHUD from "./PlayerHUD";
import Composer from "./Composer";
import SceneStage from "./SceneStage";
import CharacterForge from "./CharacterForge";

const SYSTEM_PROMPT = `Tu es le maître du jeu d'une campagne de TTRPG fantasy.
Réponds en français, ton narratif vivant, court et évocateur (2-4 phrases max).
Décris les conséquences des actions des joueurs, fais parler les PNJ en italique entre guillemets.
Ne tranche jamais à la place du joueur. Demande un jet de dé quand l'issue est incertaine.
Pas de listes à puces — seulement de la prose.`;

const PREFILLS: Record<Exclude<QuickAction, "roll">, string> = {
  speak: "Je dis : « ",
  act: "Je ",
  spell: "Je lance le sort ",
};

export default function SessionView() {
  const { campaignId, sessionId } = useParams<{ campaignId: string; sessionId: string }>();
  const { user, logout } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [prefillToken, setPrefillToken] = useState(0);
  const [showForge, setShowForge] = useState(false);
  const [forgeAutoOpened, setForgeAutoOpened] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    getCampaign(campaignId).then(setCampaign);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId || !sessionId) return;
    return watchMessages(campaignId, sessionId, setMessages);
  }, [campaignId, sessionId]);

  useEffect(() => {
    if (!campaignId) return;
    listCharacters(campaignId).then(setCharacters);
  }, [campaignId]);

  const myCharacter = useMemo(
    () => characters.find((c) => c.ownerUid === user?.uid) ?? null,
    [characters, user?.uid]
  );

  useEffect(() => {
    if (!user || !campaign) return;
    if (!myCharacter && !forgeAutoOpened) {
      setShowForge(true);
      setForgeAutoOpened(true);
    }
  }, [user, campaign, myCharacter, forgeAutoOpened]);

  if (!campaign || !campaignId || !sessionId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="eyebrow animate-pulse">La table s'éveille...</div>
      </div>
    );
  }
  const isHost = campaign.hostUid === user.uid;
  const lastGm = [...messages].reverse().find((m) => m.type === "gm");

  async function send(content: string) {
    if (!campaignId || !sessionId || !user) return;
    setError(null);
    await postMessage(campaignId, sessionId, user.uid, content, "player");
  }

  async function askGM() {
    if (!campaignId || !sessionId) return;
    setError(null);
    setThinking(true);
    try {
      const transcript: GroqMessage[] = [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nCampagne : ${campaign?.name}.\nPitch : ${campaign?.description ?? "aucun"}.`,
        },
        ...messages.map((m): GroqMessage => ({
          role: m.type === "gm" ? "assistant" : "user",
          content: m.type === "gm" ? m.content : `[${m.type}] ${m.content}`,
        })),
      ];
      await callGroq({
        campaignId,
        sessionId,
        messages: transcript,
        persistAs: "gm",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Le MJ a perdu sa voix.");
    } finally {
      setThinking(false);
    }
  }

  async function handleQuickAction(kind: QuickAction) {
    if (!campaignId || !sessionId || !user) return;
    if (kind === "roll") {
      const value = Math.floor(Math.random() * 20) + 1;
      const who = myCharacter?.name ?? user.displayName ?? "Aventurier";
      await postMessage(
        campaignId,
        sessionId,
        user.uid,
        `${who} lance 1d20 → ${value}${value === 20 ? " (réussite critique !)" : value === 1 ? " (échec critique !)" : ""}`,
        "dice"
      );
      return;
    }
    setPrefill(PREFILLS[kind]);
    setPrefillToken((n) => n + 1);
  }

  async function handleForge(name: string, className: string) {
    if (!campaignId || !user) return;
    await createCharacter(campaignId, user.uid, name, className);
    const updated = await listCharacters(campaignId);
    setCharacters(updated);
    setShowForge(false);
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <SceneStage campaignName={campaign.name} characters={characters} currentUid={user.uid} />

      <header className="relative z-10 h-12 border-b border-hairline bg-ink-900/70 backdrop-blur-md flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link
            to={`/campaigns/${campaignId}`}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
          >
            ← Table
          </Link>
          <div className="font-mono text-[10px] tracking-label uppercase text-ink-300">
            <span className="text-parchment">Mythoria</span> · {campaign.name} · Tour {messages.filter((m) => m.type === "gm").length + 1}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="font-mono text-[10px] tracking-label uppercase text-ink-400">
            {user.displayName ?? user.email?.split("@")[0]}
          </span>
          <button
            onClick={logout}
            className="font-mono text-[10px] tracking-label uppercase text-ink-400 hover:text-ember"
          >
            Sortir
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6 space-y-3 pb-[180px]">
          {messages.length === 0 ? (
            <div className="max-w-lg mx-auto mt-20 text-center">
              <div className="eyebrow mb-3">Page blanche</div>
              <p className="font-serif italic text-[18px] text-parchment-2 leading-relaxed">
                « La lanterne n'est pas encore allumée. {isHost ? "Pose la première scène, ou demande au MJ de commencer." : "Attends que le MJ ouvre le chapitre."} »
              </p>
            </div>
          ) : (
            messages.map((m) => <TranscriptLine key={m.id} message={m} currentUid={user.uid} />)
          )}
          {thinking && (
            <div className="fade-in panel-gold p-4 max-w-2xl">
              <div className="eyebrow text-arcane mb-1">Le Maître</div>
              <p className="font-serif italic text-parchment-2 text-[15px] animate-pulse m-0">
                réfléchit à haute voix...
              </p>
            </div>
          )}
        </div>

        <NarrationPanel
          message={lastGm}
          isHost={isHost}
          thinking={thinking}
          onAskGM={askGM}
          canAsk={messages.length > 0}
          onQuickAction={handleQuickAction}
          hasCharacter={Boolean(myCharacter)}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-[300px] z-20 p-4">
        {error && <div className="mb-2 chip chip-ember">{error}</div>}
        <div className="flex gap-3 items-end">
          <PlayerHUD
            displayName={user.displayName ?? user.email?.split("@")[0] ?? "Aventurier"}
            character={myCharacter}
            onForge={() => setShowForge(true)}
          />
          <Composer onSend={send} prefill={prefill} prefillToken={prefillToken} />
        </div>
      </div>

      {showForge && (
        <CharacterForge
          onCreate={handleForge}
          onClose={() => setShowForge(false)}
          dismissible={Boolean(myCharacter)}
        />
      )}
    </div>
  );
}

function TranscriptLine({ message, currentUid }: { message: Message; currentUid: string }) {
  const m = message;
  if (m.type === "gm") {
    return (
      <div className="fade-in panel-gold p-5 max-w-3xl mr-auto">
        <div className="eyebrow text-arcane mb-2">Le Maître raconte</div>
        <p className="font-serif italic text-parchment-2 text-[16px] leading-[1.55] m-0 whitespace-pre-wrap">
          {m.content}
        </p>
      </div>
    );
  }
  if (m.type === "system" || m.type === "dice") {
    return (
      <div className="fade-in flex items-center gap-3 py-1.5 max-w-3xl mr-auto">
        <span className="chip chip-moss">{m.type === "dice" ? "Dé" : "Système"}</span>
        <span className="font-mono text-[12px] text-ink-300">{m.content}</span>
      </div>
    );
  }
  const mine = m.authorUid === currentUid;
  return (
    <div className={`fade-in panel p-4 max-w-2xl ${mine ? "ml-auto border-gold-500/30" : "mr-auto"}`}>
      <div className="eyebrow mb-1">
        {mine ? "Toi" : m.authorUid.slice(0, 6)} · action
      </div>
      <p className="font-sans text-parchment text-[14px] leading-[1.6] m-0 whitespace-pre-wrap">
        {m.content}
      </p>
    </div>
  );
}
