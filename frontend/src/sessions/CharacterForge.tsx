import { useMemo, useState } from "react";
import {
  BEARDS,
  CLASSES,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  POINT_BUY_COST,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_TOTAL,
  RACES,
  SKILL_LABELS,
  SKILL_POINTS_MAX_PER_SKILL,
  SKILL_POINTS_TOTAL,
  SKIN_TONES,
  STAT_LABELS,
  getClass,
  getRace,
} from "../lib/characterPresets";
import { buildPortraitUrl, newSeed } from "../lib/portrait";
import type {
  Appearance,
  Character,
  ClassId,
  RaceId,
  SkillKey,
  StatKey,
} from "../lib/types";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  onCreate: (data: Omit<Character, "id">) => Promise<void>;
  onClose?: () => void;
  dismissible?: boolean;
  ownerUid: string;
}

type Step = "identity" | "stats" | "skills" | "appearance" | "portrait";

const STEPS: { id: Step; label: string }[] = [
  { id: "identity", label: "Identité" },
  { id: "stats", label: "Caractéristiques" },
  { id: "skills", label: "Compétences" },
  { id: "appearance", label: "Apparence" },
  { id: "portrait", label: "Portrait" },
];

const ZERO_STATS: Record<StatKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const ZERO_SKILLS: Record<SkillKey, number> = {
  combat: 0, stealth: 0, magic: 0, social: 0, knowledge: 0, survival: 0,
};

const DEFAULT_APPEARANCE: Appearance = {
  gender: "male",
  skin: "fair",
  hairColor: "brown",
  hairStyle: "short",
  eyes: "brown",
  beard: "none",
  clothing: "",
};

export default function CharacterForge({ onCreate, onClose, dismissible = false, ownerUid }: Props) {
  const [step, setStep] = useState<Step>("identity");
  const [name, setName] = useState("");
  const [race, setRace] = useState<RaceId | undefined>();
  const [classId, setClassId] = useState<ClassId | undefined>();
  const [stats, setStats] = useState<Record<StatKey, number>>({ ...ZERO_STATS });
  const [skills, setSkills] = useState<Record<SkillKey, number>>({ ...ZERO_SKILLS });
  const [appearance, setAppearance] = useState<Appearance>({ ...DEFAULT_APPEARANCE });
  const [seed, setSeed] = useState<number>(() => newSeed());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const racePreset = getRace(race);
  const classPreset = getClass(classId);

  const finalStats = useMemo(() => {
    const out = { ...stats };
    if (racePreset) {
      for (const k of Object.keys(racePreset.bonus) as StatKey[]) {
        out[k] = (out[k] ?? 0) + (racePreset.bonus[k] ?? 0);
      }
    }
    return out;
  }, [stats, racePreset]);

  const pointsSpent = useMemo(
    () => Object.values(stats).reduce((acc, v) => acc + (POINT_BUY_COST[v] ?? 0), 0),
    [stats]
  );
  const pointsLeft = POINT_BUY_TOTAL - pointsSpent;

  const skillsSpent = useMemo(
    () => Object.values(skills).reduce((a, b) => a + b, 0),
    [skills]
  );
  const skillsLeft = SKILL_POINTS_TOTAL - skillsSpent;

  const portraitUrl = useMemo(
    () => buildPortraitUrl({ race, classId, appearance, name }, seed, 512),
    [race, classId, appearance, name, seed]
  );

  function adjustStat(key: StatKey, delta: number) {
    setStats((s) => {
      const next = Math.max(POINT_BUY_MIN, Math.min(POINT_BUY_MAX, s[key] + delta));
      const trial = { ...s, [key]: next };
      const cost = Object.values(trial).reduce((acc, v) => acc + (POINT_BUY_COST[v] ?? 0), 0);
      if (cost > POINT_BUY_TOTAL) return s;
      return trial;
    });
  }

  function adjustSkill(key: SkillKey, delta: number) {
    setSkills((s) => {
      const next = Math.max(0, Math.min(SKILL_POINTS_MAX_PER_SKILL, s[key] + delta));
      const trial = { ...s, [key]: next };
      const total = Object.values(trial).reduce((a, b) => a + b, 0);
      if (total > SKILL_POINTS_TOTAL) return s;
      return trial;
    });
  }

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  function canAdvance(): boolean {
    switch (step) {
      case "identity":
        return Boolean(name.trim() && race && classId);
      case "stats":
        return pointsLeft === 0;
      case "skills":
        return skillsLeft === 0;
      case "appearance":
        return true;
      case "portrait":
        return true;
    }
  }

  function next() {
    if (!canAdvance()) return;
    const i = STEPS.findIndex((s) => s.id === step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].id);
  }
  function prev() {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i > 0) setStep(STEPS[i - 1].id);
  }

  async function submit() {
    if (!classPreset || !race || !classId) return;
    setBusy(true);
    setError(null);
    try {
      const data: Omit<Character, "id"> = {
        ownerUid,
        name: name.trim(),
        race,
        classId,
        className: classPreset.label,
        level: 1,
        stats: finalStats,
        skills,
        appearance,
        portraitSeed: seed,
        portraitPrompt: portraitUrl,
        inventory: [],
      };
      await onCreate(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forge ratée.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 backdrop-blur-sm fade-in">
      <div className="panel-gold w-[min(96vw,960px)] max-h-[92vh] flex flex-col shadow-panel">
        {/* Header with steps */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div>
            <div className="eyebrow mb-1">Forge</div>
            <h2 className="font-serif text-[22px] text-parchment m-0">
              {STEPS[stepIdx].label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-2"
                title={s.label}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < stepIdx
                      ? "bg-gold-500"
                      : i === stepIdx
                      ? "bg-gold-400 ring-2 ring-gold-400/30"
                      : "bg-ink-600"
                  }`}
                />
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-rule" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          {step === "identity" && (
            <IdentityStep
              name={name}
              setName={setName}
              race={race}
              setRace={setRace}
              classId={classId}
              setClassId={setClassId}
            />
          )}
          {step === "stats" && (
            <StatsStep
              stats={stats}
              finalStats={finalStats}
              racePreset={racePreset}
              pointsLeft={pointsLeft}
              adjust={adjustStat}
            />
          )}
          {step === "skills" && (
            <SkillsStep
              skills={skills}
              skillsLeft={skillsLeft}
              classPreset={classPreset}
              adjust={adjustSkill}
            />
          )}
          {step === "appearance" && (
            <AppearanceStep
              appearance={appearance}
              setAppearance={setAppearance}
            />
          )}
          {step === "portrait" && (
            <PortraitStep
              portraitUrl={portraitUrl}
              onReroll={() => setSeed(newSeed())}
              name={name}
              race={racePreset?.label ?? ""}
              className={classPreset?.label ?? ""}
            />
          )}
          {error && <p className="text-ember text-[13px] mt-4">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-rule">
          <div className="flex items-center gap-3">
            {dismissible && onClose && (
              <button onClick={onClose} className="btn-ghost text-[12px]">
                Plus tard
              </button>
            )}
            {stepIdx > 0 && (
              <button onClick={prev} className="btn-ghost text-[12px]">
                ← Retour
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === "stats" && (
              <span className="font-mono text-[11px] tracking-label uppercase text-ink-300">
                Points : <span className={pointsLeft === 0 ? "text-gold-400" : "text-ember"}>{pointsLeft}</span> / {POINT_BUY_TOTAL}
              </span>
            )}
            {step === "skills" && (
              <span className="font-mono text-[11px] tracking-label uppercase text-ink-300">
                Points : <span className={skillsLeft === 0 ? "text-gold-400" : "text-ember"}>{skillsLeft}</span> / {SKILL_POINTS_TOTAL}
              </span>
            )}
            {stepIdx < STEPS.length - 1 ? (
              <button onClick={next} disabled={!canAdvance()} className="btn-primary">
                Continuer →
              </button>
            ) : (
              <button onClick={submit} disabled={busy} className="btn-primary">
                {busy ? "Forge en cours..." : "Forger"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step components ---------- */

function IdentityStep({
  name, setName, race, setRace, classId, setClassId,
}: {
  name: string; setName: (s: string) => void;
  race: RaceId | undefined; setRace: (r: RaceId) => void;
  classId: ClassId | undefined; setClassId: (c: ClassId) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="label mb-2">Nom du personnage</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Elara la Silencieuse"
          className="field font-serif text-[20px] w-full"
          autoFocus
        />
      </div>

      <div>
        <div className="label mb-3">Race</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RACES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRace(r.id)}
              className={`text-left panel p-3 transition-colors ${
                race === r.id ? "border-gold-500 bg-ink-800/60" : "hover:border-hairline"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-[17px] text-parchment">{r.label}</span>
                <span className="font-mono text-[10px] tracking-label uppercase text-gold-400">
                  {Object.entries(r.bonus)
                    .map(([k, v]) => `+${v} ${STAT_LABELS[k as StatKey].short}`)
                    .join(" ")}
                </span>
              </div>
              <p className="font-serif italic text-[13px] text-ink-300 m-0 leading-snug">{r.flavor}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-3">Classe</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setClassId(c.id)}
              className={`text-left panel p-3 transition-colors ${
                classId === c.id ? "border-gold-500 bg-ink-800/60" : "hover:border-hairline"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-[17px] text-parchment">{c.label}</span>
                <span className="font-mono text-[10px] tracking-label uppercase text-arcane">
                  {c.primarySkills.map((s) => SKILL_LABELS[s].label).join(" · ")}
                </span>
              </div>
              <p className="font-serif italic text-[13px] text-ink-300 m-0 leading-snug">{c.flavor}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsStep({
  stats, finalStats, racePreset, pointsLeft, adjust,
}: {
  stats: Record<StatKey, number>;
  finalStats: Record<StatKey, number>;
  racePreset: ReturnType<typeof getRace>;
  pointsLeft: number;
  adjust: (k: StatKey, d: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="font-serif italic text-ink-300 text-[14px]">
        Système d'achat à 27 points (D&D 5e). Coûts : 9→1, 10→2, ... 13→5, 14→7, 15→9. Bonus de race appliqués automatiquement.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => {
          const base = stats[k];
          const final = finalStats[k];
          const bonus = racePreset?.bonus[k] ?? 0;
          const cost = POINT_BUY_COST[base] ?? 0;
          return (
            <div key={k} className="panel p-3 flex items-center justify-between">
              <div>
                <div className="font-serif text-[16px] text-parchment">{STAT_LABELS[k].full}</div>
                <div className="font-mono text-[10px] tracking-label uppercase text-ink-400">
                  Coût : {cost}
                  {bonus > 0 && <span className="text-gold-400"> · race +{bonus}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjust(k, -1)}
                  disabled={base <= POINT_BUY_MIN}
                  className="w-8 h-8 rounded-sm border border-hairline text-parchment hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="font-serif text-[24px] text-parchment min-w-[3ch] text-center">
                  {final}
                  {bonus > 0 && <span className="font-mono text-[11px] text-gold-400 ml-1">({base})</span>}
                </div>
                <button
                  onClick={() => adjust(k, +1)}
                  disabled={base >= POINT_BUY_MAX || pointsLeft <= 0}
                  className="w-8 h-8 rounded-sm border border-hairline text-parchment hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillsStep({
  skills, skillsLeft, classPreset, adjust,
}: {
  skills: Record<SkillKey, number>;
  skillsLeft: number;
  classPreset: ReturnType<typeof getClass>;
  adjust: (k: SkillKey, d: number) => void;
}) {
  const primary = new Set(classPreset?.primarySkills ?? []);
  return (
    <div className="space-y-4">
      <p className="font-serif italic text-ink-300 text-[14px]">
        Distribue {SKILL_POINTS_TOTAL} points dans 6 catégories (max {SKILL_POINTS_MAX_PER_SKILL} par compétence).
        Les compétences <span className="text-gold-400">dorées</span> sont les domaines naturels de ta classe.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(SKILL_LABELS) as SkillKey[]).map((k) => {
          const value = skills[k];
          const isPrimary = primary.has(k);
          return (
            <div key={k} className={`panel p-3 ${isPrimary ? "border-gold-500/50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`font-serif text-[16px] ${isPrimary ? "text-gold-300" : "text-parchment"}`}>
                    {SKILL_LABELS[k].label}
                  </div>
                  <div className="font-serif italic text-[12px] text-ink-400">{SKILL_LABELS[k].flavor}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjust(k, -1)}
                    disabled={value <= 0}
                    className="w-7 h-7 rounded-sm border border-hairline text-parchment hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed text-[14px]"
                  >
                    −
                  </button>
                  <div className="font-serif text-[20px] text-parchment min-w-[2ch] text-center">{value}</div>
                  <button
                    onClick={() => adjust(k, +1)}
                    disabled={value >= SKILL_POINTS_MAX_PER_SKILL || skillsLeft <= 0}
                    className="w-7 h-7 rounded-sm border border-hairline text-parchment hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed text-[14px]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: SKILL_POINTS_MAX_PER_SKILL }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-sm"
                    style={{
                      background: i < value ? (isPrimary ? "var(--gold-400)" : "var(--moss)") : "rgba(255,255,255,.05)",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppearanceStep({
  appearance, setAppearance,
}: {
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
}) {
  function set<K extends keyof Appearance>(k: K, v: Appearance[K]) {
    setAppearance({ ...appearance, [k]: v });
  }
  return (
    <div className="space-y-6">
      <p className="font-serif italic text-ink-300 text-[14px]">
        Ces choix guideront la génération du portrait. Tu pourras le re-générer ensuite.
      </p>

      <PickerRow label="Genre" options={GENDERS} selected={appearance.gender} onSelect={(v) => set("gender", v as Appearance["gender"])} />
      <PickerRow label="Peau" options={SKIN_TONES} selected={appearance.skin} onSelect={(v) => set("skin", v)} />
      <PickerRow label="Couleur des cheveux" options={HAIR_COLORS} selected={appearance.hairColor} onSelect={(v) => set("hairColor", v)} />
      <PickerRow label="Coupe" options={HAIR_STYLES} selected={appearance.hairStyle} onSelect={(v) => set("hairStyle", v)} />
      <PickerRow label="Yeux" options={EYE_COLORS} selected={appearance.eyes} onSelect={(v) => set("eyes", v)} />
      {appearance.gender !== "female" && (
        <PickerRow label="Barbe" options={BEARDS} selected={appearance.beard} onSelect={(v) => set("beard", v)} />
      )}

      <div>
        <div className="label mb-2">Détails libres (cicatrices, tatouages, accessoires...)</div>
        <input
          value={appearance.clothing}
          onChange={(e) => set("clothing", e.target.value)}
          placeholder="cicatrice à l'œil gauche, médaillon en argent..."
          maxLength={120}
          className="field font-serif text-[14px] w-full"
        />
      </div>
    </div>
  );
}

function PickerRow({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <div className="label mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={`px-3 py-1.5 rounded-sm border font-mono text-[11px] tracking-label uppercase transition-colors ${
              selected === o.id
                ? "border-gold-500 bg-ink-800/70 text-gold-300"
                : "border-hairline text-ink-300 hover:border-gold-500/50 hover:text-parchment"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PortraitStep({
  portraitUrl, onReroll, name, race, className,
}: {
  portraitUrl: string;
  onReroll: () => void;
  name: string;
  race: string;
  className: string;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-full md:w-[360px] shrink-0">
        <CharacterPortrait src={portraitUrl} alt={name} size={360} />
        <button onClick={onReroll} className="btn-ghost w-full mt-3">
          ↻ Re-générer le portrait
        </button>
        <p className="font-mono text-[10px] tracking-label uppercase text-ink-400 text-center mt-2">
          Génération via Pollinations.ai · ~5-15s
        </p>
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <div className="eyebrow mb-1">Identité</div>
          <div className="font-serif text-[28px] text-parchment leading-tight">{name || "—"}</div>
          <div className="font-mono text-[11px] tracking-label uppercase text-ink-300 mt-1">
            {race} · {className} · niv. 1
          </div>
        </div>
        <p className="font-serif italic text-[14px] text-ink-300">
          Si l'image ne te plaît pas, clique sur "re-générer" : un nouveau seed change le rendu sans modifier tes choix.
          Tu peux aussi revenir en arrière pour ajuster les détails d'apparence.
        </p>
      </div>
    </div>
  );
}
