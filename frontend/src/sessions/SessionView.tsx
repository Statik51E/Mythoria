import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getCampaign,
  watchMessages,
  postMessage,
  watchCharacters,
  createCharacter,
  updateCharacter,
  watchSession,
  updateSession,
} from "../lib/firestore";
import { callGroq, GroqMessage } from "../lib/groqClient";
import type {
  Campaign,
  Character,
  CurrentScene,
  EquipSlot,
  Equipment,
  Item,
  Message,
  MessageType,
  SessionDoc,
  TokenPosition,
} from "../lib/types";
type NewCharacter = Omit<Character, "id">;
import NarrationPanel, { QuickAction } from "./NarrationPanel";
import PlayerHUD from "./PlayerHUD";
import Composer from "./Composer";
import SceneStage from "./SceneStage";
import SceneSelector from "./SceneSelector";
import CharacterForge from "./CharacterForge";
import DiceRoll from "./DiceRoll";
import Inventory, { ItemAction } from "./Inventory";

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

interface PendingRoll {
  value: number;
  rollerName: string;
}

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
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showSceneSelector, setShowSceneSelector] = useState(false);
  const [session, setSession] = useState<SessionDoc | null>(null);
  const askingRef = useRef(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  useEffect(() => {
    if (!campaignId) return;
    getCampaign(campaignId).then(setCampaign);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId || !sessionId) return;
    return watchMessages(campaignId, sessionId, setMessages);
  }, [campaignId, sessionId]);

  useEffect(() => {
    if (!campaignId || !sessionId) return;
    return watchSession(campaignId, sessionId, setSession);
  }, [campaignId, sessionId]);

  useEffect(() => {
    if (!campaignId) return;
    return watchCharacters(campaignId, setCharacters);
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
      <div className="h-screen flex items-center justify-center">
        <div className="eyebrow animate-pulse">La table s'éveille...</div>
      </div>
    );
  }
  const isHost = campaign.hostUid === user.uid;
  const lastGm = [...messages].reverse().find((m) => m.type === "gm");

  async function askGM(extra?: { type: MessageType; content: string }) {
    if (!campaignId || !sessionId || askingRef.current) return;
    askingRef.current = true;
    setError(null);
    setThinking(true);
    try {
      const sceneLine = session?.currentScene
        ? `\nScène actuelle : ${session.currentScene.label}.`
        : "";
      const baseTranscript: GroqMessage[] = [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nCampagne : ${campaign?.name}.\nPitch : ${campaign?.description ?? "aucun"}.${sceneLine}`,
        },
        ...messages.map((m): GroqMessage => ({
          role: m.type === "gm" ? "assistant" : "user",
          content: m.type === "gm" ? m.content : `[${m.type}] ${m.content}`,
        })),
      ];
      if (extra) {
        baseTranscript.push({ role: "user", content: `[${extra.type}] ${extra.content}` });
      }
      await callGroq({
        campaignId,
        sessionId,
        messages: baseTranscript,
        persistAs: "gm",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Le MJ a perdu sa voix.");
    } finally {
      setThinking(false);
      askingRef.current = false;
    }
  }

  async function send(content: string) {
    if (!campaignId || !sessionId || !user) return;
    setError(null);
    await postMessage(campaignId, sessionId, user.uid, content, "player");
    if (isHost) {
      await askGM({ type: "player", content });
    }
  }

  async function handleQuickAction(kind: QuickAction) {
    if (!campaignId || !sessionId || !user) return;
    if (kind === "roll") {
      const value = Math.floor(Math.random() * 20) + 1;
      const who = myCharacter?.name ?? user.displayName ?? "Aventurier";
      setPendingRoll({ value, rollerName: who });
      const diceText = `${who} lance 1d20 → ${value}${value === 20 ? " (réussite critique !)" : value === 1 ? " (échec critique !)" : ""}`;
      await postMessage(campaignId, sessionId, user.uid, diceText, "dice");
      if (isHost) {
        // Wait for the dice animation to play before MJ reacts.
        setTimeout(() => {
          askGM({ type: "dice", content: diceText });
        }, 2400);
      }
      return;
    }
    setPrefill(PREFILLS[kind]);
    setPrefillToken((n) => n + 1);
  }

  async function handleForge(data: NewCharacter) {
    if (!campaignId || !user) return;
    await createCharacter(campaignId, data);
    setShowForge(false);
  }

  async function handlePickScene(scene: CurrentScene) {
    if (!campaignId || !sessionId || !user) return;
    await updateSession(campaignId, sessionId, { currentScene: scene });
    await postMessage(
      campaignId,
      sessionId,
      user.uid,
      `Le décor change : ${scene.label}.`,
      "system"
    );
    setShowSceneSelector(false);
  }

  async function handleMoveToken(charId: string, pos: TokenPosition) {
    if (!campaignId || !sessionId) return;
    const nextTokens = { ...(session?.tokens ?? {}), [charId]: pos };
    await updateSession(campaignId, sessionId, { tokens: nextTokens });
  }

  async function handleItemAction(item: Item, action: ItemAction) {
    if (!campaignId || !sessionId || !user || !myCharacter) return;
    const ch = myCharacter;
    const equipment: Equipment = ch.equipment ?? {};
    const slot = item.slot;

    let newInventory = ch.inventory;
    let newEquipment: Equipment = equipment;
    let line = "";

    if (action === "use") {
      const remainingQty = (item.quantity ?? 1) - 1;
      newInventory = remainingQty > 0
        ? ch.inventory.map((i) => (i.id === item.id ? { ...i, quantity: remainingQty } : i))
        : ch.inventory.filter((i) => i.id !== item.id);
      line = `${ch.name} utilise ${item.name}.`;
    } else if (action === "equip" && slot) {
      const previouslyEquipped = equipment[slot];
      newEquipment = { ...equipment, [slot]: item };
      if (previouslyEquipped) {
        line = `${ch.name} range ${previouslyEquipped.name} et équipe ${item.name}.`;
      } else {
        line = `${ch.name} équipe ${item.name}.`;
      }
    } else if (action === "unequip" && slot) {
      newEquipment = { ...equipment, [slot]: null };
      line = `${ch.name} range ${item.name}.`;
    } else if (action === "drop") {
      newInventory = ch.inventory.filter((i) => i.id !== item.id);
      const slots: EquipSlot[] = ["weapon", "armor", "accessory"];
      const eqCopy: Equipment = { ...equipment };
      for (const s of slots) {
        if (eqCopy[s]?.id === item.id) eqCopy[s] = null;
      }
      newEquipment = eqCopy;
      line = `${ch.name} jette ${item.name}.`;
    }

    await updateCharacter(campaignId, ch.id, {
      inventory: newInventory,
      equipment: newEquipment,
    });
    if (line) {
      await postMessage(campaignId, sessionId, user.uid, line, "system");
      if (isHost && action === "use") {
        await askGM({ type: "system", content: line });
      }
    }
  }

  return (
    <div className="h-screen relative flex flex-col overflow-hidden">
      <SceneStage
        campaignName={campaign.name}
        characters={characters}
        currentUid={user.uid}
        isHost={isHost}
        scene={session?.currentScene}
        tokens={session?.tokens}
        onMoveToken={handleMoveToken}
        onOpenSceneSelector={() => setShowSceneSelector(true)}
      />

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

      <div className="relative z-10 flex-1 flex min-h-0">
        <div
          ref={messagesScrollRef}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-8 py-6 space-y-3 pb-[180px]"
        >
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
          onAskGM={() => askGM()}
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
            onOpenInventory={() => setShowInventory(true)}
          />
          <Composer onSend={send} prefill={prefill} prefillToken={prefillToken} />
        </div>
      </div>

      {showForge && (
        <CharacterForge
          ownerUid={user.uid}
          onCreate={handleForge}
          onClose={() => setShowForge(false)}
          dismissible={Boolean(myCharacter)}
        />
      )}

      {pendingRoll && (
        <DiceRoll
          finalValue={pendingRoll.value}
          rollerName={pendingRoll.rollerName}
          onDone={() => setPendingRoll(null)}
        />
      )}

      {showInventory && myCharacter && (
        <Inventory
          character={myCharacter}
          onClose={() => setShowInventory(false)}
          onAction={handleItemAction}
        />
      )}

      {showSceneSelector && (
        <SceneSelector
          current={session?.currentScene}
          onPick={handlePickScene}
          onClose={() => setShowSceneSelector(false)}
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
