import { useState } from "react";
import type { Character, SkillKey, StatKey } from "../lib/types";
import { SKILL_LABELS, STAT_LABELS } from "../lib/characterPresets";

interface Props {
  character: Character;
  onClose: () => void;
  onRoll: (stat: StatKey, skill?: SkillKey) => void;
}

const STAT_KEYS: StatKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const SKILL_KEYS: SkillKey[] = ["combat", "stealth", "magic", "social", "knowledge", "survival"];

export default function SkillCheckPicker({ character, onClose, onRoll }: Props) {
  const [stat, setStat] = useState<StatKey>("dex");
  const [skill, setSkill] = useState<SkillKey | null>(null);

  const statValue = character.stats?.[stat] ?? 10;
  const statMod = Math.floor((statValue - 10) / 2);
  const skillBonus = skill ? (character.skills?.[skill] ?? 0) : 0;
  const totalMod = statMod + skillBonus;
  const sign = totalMod >= 0 ? "+" : "−";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center fade-in"
      style={{ background: "rgba(8,6,4,.55)" }}
      onClick={onClose}
    >
      <div
        className="panel-gold w-[min(96vw,520px)] shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-strong">
          <div>
            <div className="eyebrow text-arcane">Test</div>
            <div className="font-serif text-[18px] text-parchment">Choisis l'attribut</div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-label uppercase text-ink-400 hover:text-gold-400"
          >
            Fermer · Esc
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="label mb-2">Attribut</div>
            <div className="grid grid-cols-3 gap-1.5">
              {STAT_KEYS.map((k) => {
                const v = character.stats?.[k] ?? 10;
                const m = Math.floor((v - 10) / 2);
                const ms = m >= 0 ? `+${m}` : `${m}`;
                const active = stat === k;
                return (
                  <button
                    key={k}
                    onClick={() => setStat(k)}
                    className={`panel py-2 text-center transition-colors ${
                      active ? "border-gold-500 bg-gold-500/10" : "hover:border-hairline"
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-label uppercase text-ink-300">
                      {STAT_LABELS[k].short}
                    </div>
                    <div className="font-serif text-[14px] text-parchment leading-none mt-1">
                      {v} <span className="text-ink-400 text-[11px]">({ms})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label mb-2">Compétence (optionnel)</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSkill(null)}
                className={`panel py-2 px-2 text-left transition-colors ${
                  skill === null ? "border-gold-500 bg-gold-500/10" : "hover:border-hairline"
                }`}
              >
                <div className="font-mono text-[10px] tracking-label uppercase text-ink-300">— Aucune —</div>
                <div className="font-serif italic text-[11px] text-ink-400">Test pur</div>
              </button>
              {SKILL_KEYS.map((k) => {
                const b = character.skills?.[k] ?? 0;
                const active = skill === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSkill(k)}
                    className={`panel py-2 px-2 text-left transition-colors ${
                      active ? "border-gold-500 bg-gold-500/10" : "hover:border-hairline"
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-label uppercase text-ink-300">
                      {SKILL_LABELS[k].label} <span className="text-gold-400">+{b}</span>
                    </div>
                    <div className="font-serif italic text-[11px] text-ink-400 truncate">{SKILL_LABELS[k].flavor}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-hairline-strong pt-3 flex items-center justify-between">
            <div className="font-mono text-[11px] text-ink-300">
              <span className="text-parchment">1d20 {sign} {Math.abs(totalMod)}</span>
              <span className="text-ink-400 ml-2">
                ({STAT_LABELS[stat].short} {statMod >= 0 ? "+" : ""}{statMod}
                {skill ? `, ${SKILL_LABELS[skill].label} +${skillBonus}` : ""})
              </span>
            </div>
            <button
              onClick={() => onRoll(stat, skill ?? undefined)}
              className="btn-primary !py-1.5 !px-4"
            >
              Lancer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
