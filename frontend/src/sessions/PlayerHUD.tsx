import { useMemo } from "react";
import type { Character } from "../lib/types";
import { buildPortraitUrl } from "../lib/portrait";
import { xpForNextLevel } from "../lib/characterPresets";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  displayName: string;
  character?: Character | null;
  onForge?: () => void;
  onOpenInventory?: () => void;
}

export default function PlayerHUD({ displayName, character, onForge, onOpenInventory }: Props) {
  const name = character?.name ?? displayName;
  const subtitle = character ? `${character.className} · niv. ${character.level}` : "Sans personnage";
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portraitUrl = useMemo(() => {
    if (!character?.portraitSeed) return null;
    return buildPortraitUrl(
      {
        race: character.race,
        classId: character.classId,
        appearance: character.appearance,
        name: character.name,
      },
      character.portraitSeed,
      192
    );
  }, [character]);

  return (
    <div className="panel-gold p-3 flex items-center gap-3 shadow-panel shrink-0">
      {portraitUrl ? (
        <CharacterPortrait
          src={portraitUrl}
          alt={name}
          size={64}
          rounded="md"
          fallbackInitials={initials}
        />
      ) : (
        <div
          className="w-16 h-16 rounded-sm border border-hairline-strong flex items-center justify-center font-serif text-[24px] text-parchment"
          style={{ background: "linear-gradient(135deg, #2a2219, #191210)" }}
        >
          {initials || "?"}
        </div>
      )}
      <div className="min-w-[160px]">
        <div className="font-serif text-[14px] text-parchment leading-tight truncate max-w-[180px]">{name}</div>
        <div className="font-mono text-[9px] tracking-label uppercase text-ink-400 mt-0.5">{subtitle}</div>
        {character ? (
          <div className="mt-2 space-y-1">
            {typeof character.maxHp === "number" && (
              <Bar
                label="PV"
                value={character.hp ?? character.maxHp}
                max={character.maxHp}
                color="ember"
              />
            )}
            {typeof character.maxMana === "number" && character.maxMana > 0 && (
              <Bar
                label="MANA"
                value={character.mana ?? character.maxMana}
                max={character.maxMana}
                color="arcane"
              />
            )}
            {(() => {
              const xp = character.xp ?? 0;
              const need = xpForNextLevel(character.level);
              if (need === null) {
                return (
                  <div className="font-mono text-[9px] tracking-label uppercase text-gold-400">
                    XP {xp} · niv. max
                  </div>
                );
              }
              return <Bar label="XP" value={Math.min(xp, need)} max={need} color="gold" />;
            })()}
            {onOpenInventory && (
              <button
                onClick={onOpenInventory}
                className="mt-1 font-mono text-[10px] tracking-label uppercase text-gold-400 hover:text-gold-300 flex items-center gap-1"
                title="Ouvrir le sac"
              >
                <span>🎒</span>
                <span>Sac · {character.inventory?.length ?? 0}</span>
              </button>
            )}
          </div>
        ) : (
          onForge && (
            <button
              onClick={onForge}
              className="mt-2 font-mono text-[10px] tracking-label uppercase text-gold-400 hover:text-gold-300"
            >
              + Forger un personnage
            </button>
          )
        )}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: "ember" | "arcane" | "gold";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const critical = color === "ember" && pct < 25;
  const bg = color === "ember"
    ? critical ? "#c0392b" : "var(--ember)"
    : color === "arcane"
    ? "var(--arcane)"
    : "var(--gold-400)";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] tracking-label uppercase text-ink-400 w-10">{label}</span>
      <div className="flex-1 h-[6px] rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
        <div
          className="h-full"
          style={{ background: bg, width: `${pct}%`, transition: "width 380ms ease-out" }}
        />
      </div>
      <span className="font-mono text-[9px] text-ink-300 w-12 text-right tabular-nums">
        {value}/{max}
      </span>
    </div>
  );
}
