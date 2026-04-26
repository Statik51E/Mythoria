import { useMemo } from "react";
import type { BestiaryEntry } from "../lib/types";
import { buildNpcPortraitUrls } from "../lib/portrait";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  bestiary?: Record<string, BestiaryEntry>;
  onClose: () => void;
}

export default function Bestiary({ bestiary, onClose }: Props) {
  const list = useMemo(() => {
    const entries = bestiary ? Object.values(bestiary) : [];
    return entries.sort((a, b) => (b.encounters ?? 0) - (a.encounters ?? 0));
  }, [bestiary]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm fade-in">
      <div className="panel-gold w-[min(96vw,720px)] max-h-[88vh] flex flex-col shadow-panel">
        <div className="flex items-center justify-between p-4 border-b border-hairline-strong">
          <div>
            <div className="eyebrow text-arcane">Mémoire</div>
            <div className="font-serif text-[20px] text-parchment">Bestiaire</div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-label uppercase text-ink-400 hover:text-gold-400"
          >
            Fermer · Esc
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.length === 0 && (
            <div className="col-span-full font-serif italic text-parchment-2 text-center py-8">
              Vide pour l'instant. Les PNJ rencontrés viendront ici lorsqu'ils sortiront de scène.
            </div>
          )}
          {list.map((e) => (
            <Card key={e.id} entry={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ entry }: { entry: BestiaryEntry }) {
  const portraitUrls = buildNpcPortraitUrls(
    {
      id: entry.id,
      name: entry.name,
      role: entry.role,
      description: entry.description,
      appearancePrompt: entry.appearancePrompt,
    },
    192
  );
  const initials = entry.name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const outcomeLabel = entry.outcome === "defeated"
    ? "Vaincu"
    : entry.outcome === "left"
    ? "Laissé"
    : entry.outcome === "departed"
    ? "Parti"
    : "Inconnu";
  const outcomeColor = entry.outcome === "defeated" ? "text-ember" : "text-ink-300";

  return (
    <div className="panel p-3 flex gap-3">
      <CharacterPortrait
        src={portraitUrls}
        alt={entry.name}
        size={64}
        rounded="md"
        fallbackInitials={initials}
      />
      <div className="min-w-0 flex-1">
        <div className="font-serif text-[15px] text-parchment leading-tight truncate">{entry.name}</div>
        <div className="font-mono text-[9px] tracking-label uppercase text-ink-400 mt-0.5">
          {entry.role} · <span className={outcomeColor}>{outcomeLabel}</span>
          {entry.encounters && entry.encounters > 1 ? ` · ×${entry.encounters}` : ""}
        </div>
        <div className="font-sans text-[12px] text-parchment-2 mt-1 leading-snug line-clamp-3">
          {entry.description}
        </div>
      </div>
    </div>
  );
}
