import { useEffect, useRef } from "react";
import type { Message, Npc, SuggestedAction } from "../lib/types";
import { buildNpcPortraitUrl } from "../lib/portrait";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  npc: Npc;
  messages: Message[];
  thinking: boolean;
  hasCharacter: boolean;
  onSuggestedAction: (action: SuggestedAction) => void;
  onSpeak: () => void;
  onClose: () => void;
}

const ROLE_LABEL: Record<Npc["role"], { label: string; color: string }> = {
  ally:    { label: "Allié",   color: "var(--moss)" },
  neutral: { label: "Neutre",  color: "#aaa08c" },
  hostile: { label: "Hostile", color: "var(--ember)" },
};

export default function InteractionScene({
  npc,
  messages,
  thinking,
  hasCharacter,
  onSuggestedAction,
  onSpeak,
  onClose,
}: Props) {
  const portraitUrl = buildNpcPortraitUrl(npc, 320);
  const role = ROLE_LABEL[npc.role];
  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);

  // Filter to messages relevant to this NPC interaction (NPC speaking + player addresses to NPC)
  const dialogue = messages.filter(
    (m) =>
      m.interactionNpcId === npc.id ||
      (m.npcId === npc.id) ||
      (m.type === "player" && m.interactionNpcId === npc.id)
  );

  const lastNpcLine = [...dialogue].reverse().find((m) => m.npcId === npc.id);
  const suggestions = lastNpcLine?.suggestedActions ?? [];

  useEffect(() => {
    const el = dialogueScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [dialogue.length, thinking]);

  return (
    <aside className="relative z-10 w-[300px] shrink-0 border-l border-hairline bg-ink-900/85 backdrop-blur-md flex flex-col fade-in">
      {/* Header with portrait */}
      <div className="p-4 border-b border-rule">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow" style={{ color: role.color }}>
            Interaction · {role.label}
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
            title="Quitter la conversation"
          >
            ← Retour
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          {portraitUrl ? (
            <div
              className="rounded-full p-[3px] mb-2"
              style={{
                background: `radial-gradient(circle, ${role.color}, ${role.color} 80%, transparent)`,
                boxShadow: `0 0 24px ${role.color}66`,
              }}
            >
              <CharacterPortrait
                src={portraitUrl}
                alt={npc.name}
                size={96}
                rounded="full"
                fallbackInitials={npc.name[0]?.toUpperCase()}
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center font-serif text-[28px] text-parchment mb-2"
              style={{ background: "linear-gradient(135deg, #2a2219, #191210)" }}
            >
              {npc.name[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="font-serif text-[18px] text-parchment leading-tight">{npc.name}</div>
          <p className="font-serif italic text-[11px] text-ink-300 mt-1 leading-snug max-w-[240px]">
            {npc.description}
          </p>
        </div>
      </div>

      {/* Dialogue scroll */}
      <div ref={dialogueScrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
        {dialogue.length === 0 ? (
          <p className="font-serif italic text-ink-400 text-[12px] text-center mt-6">
            {npc.name} t'observe en silence. À toi de parler.
          </p>
        ) : (
          dialogue.map((m) => <DialogueLine key={m.id} message={m} npcName={npc.name} />)
        )}
        {thinking && (
          <div className="fade-in panel-gold p-3">
            <div className="font-serif italic text-parchment-2 text-[12px] animate-pulse m-0">
              {npc.name} hésite...
            </div>
          </div>
        )}
      </div>

      {/* Suggested replies */}
      <div className="p-3 border-t border-rule">
        {suggestions.length > 0 && (
          <>
            <div className="eyebrow mb-2">Tu peux...</div>
            <div className="space-y-1.5 mb-3">
              {suggestions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestedAction(a)}
                  disabled={!hasCharacter}
                  className={`w-full text-left panel-gold px-3 py-1.5 font-mono text-[10px] tracking-label uppercase transition-colors ${
                    !hasCharacter
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-gold-300"
                  }`}
                  title={a.prompt}
                >
                  <span className="text-gold-200">{a.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button
          onClick={onSpeak}
          disabled={!hasCharacter}
          className="btn-ghost w-full text-[11px]"
        >
          ✎ Dire autre chose
        </button>
      </div>
    </aside>
  );
}

function DialogueLine({ message, npcName }: { message: Message; npcName: string }) {
  const m = message;
  if (m.npcId) {
    return (
      <div className="fade-in panel-gold p-3">
        <div className="eyebrow mb-1" style={{ color: "var(--gold-400)" }}>
          {npcName}
        </div>
        <p className="font-serif italic text-parchment-2 text-[13px] leading-snug m-0 whitespace-pre-wrap">
          {m.content}
        </p>
      </div>
    );
  }
  return (
    <div className="fade-in panel p-3">
      <div className="eyebrow mb-1">Toi</div>
      <p className="font-sans text-parchment text-[12px] leading-snug m-0 whitespace-pre-wrap">
        {m.content}
      </p>
    </div>
  );
}
