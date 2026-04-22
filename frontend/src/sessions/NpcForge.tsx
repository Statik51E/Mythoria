import { useMemo, useState } from "react";
import {
  BEARDS,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  RACES,
  SKIN_TONES,
  CLASSES,
} from "../lib/characterPresets";
import { buildPortraitUrl, newSeed } from "../lib/portrait";
import type { Appearance, ClassId, Npc, NpcRole, RaceId } from "../lib/types";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  onCreate: (npc: Npc) => void | Promise<void>;
  onClose: () => void;
}

const DEFAULT_APPEARANCE: Appearance = {
  gender: "male",
  skin: "fair",
  hairColor: "brown",
  hairStyle: "short",
  eyes: "brown",
  beard: "stubble",
  clothing: "",
};

const ROLE_OPTIONS: { id: NpcRole; label: string; flavor: string }[] = [
  { id: "ally", label: "Allié", flavor: "Aide les héros, ressource ou compagnon." },
  { id: "neutral", label: "Neutre", flavor: "Marchand, badaud, aubergiste, témoin." },
  { id: "hostile", label: "Hostile", flavor: "Ennemi, antagoniste, créature à abattre." },
];

export default function NpcForge({ onCreate, onClose }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<NpcRole>("neutral");
  const [description, setDescription] = useState("");
  const [race, setRace] = useState<RaceId | undefined>("human");
  const [classId, setClassId] = useState<ClassId | undefined>();
  const [appearance, setAppearance] = useState<Appearance>({ ...DEFAULT_APPEARANCE });
  const [seed, setSeed] = useState<number>(() => newSeed());
  const [busy, setBusy] = useState(false);

  const portraitUrl = useMemo(
    () => buildPortraitUrl({ race, classId, appearance, name }, seed, 360),
    [race, classId, appearance, name, seed]
  );

  function set<K extends keyof Appearance>(k: K, v: Appearance[K]) {
    setAppearance({ ...appearance, [k]: v });
  }

  async function submit() {
    if (!name.trim() || !description.trim()) return;
    setBusy(true);
    const npc: Npc = {
      id: `npc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      role,
      description: description.trim(),
      race,
      classId,
      appearance,
      portraitSeed: seed,
    };
    await onCreate(npc);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 backdrop-blur-sm fade-in" onClick={onClose}>
      <div
        className="panel-gold w-[min(96vw,920px)] max-h-[92vh] flex flex-col shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div>
            <div className="eyebrow mb-1">PNJ</div>
            <h2 className="font-serif text-[22px] text-parchment m-0">Forger un PNJ</h2>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-ink-300 hover:text-parchment">✕</button>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: form */}
          <div className="w-[460px] border-r border-rule overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
            <div>
              <div className="label mb-2">Nom</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Brundir le Forgeron"
                className="field font-serif text-[16px] w-full"
                autoFocus
              />
            </div>

            <div>
              <div className="label mb-2">Rôle</div>
              <div className="grid grid-cols-3 gap-1.5">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`panel p-2 text-center transition-colors ${
                      role === r.id ? "border-gold-500 bg-ink-800/60" : "hover:border-hairline"
                    }`}
                    title={r.flavor}
                  >
                    <span className="font-serif text-[13px] text-parchment">{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="font-serif italic text-[11px] text-ink-400 mt-1">
                {ROLE_OPTIONS.find((r) => r.id === role)?.flavor}
              </p>
            </div>

            <div>
              <div className="label mb-2">Description (caractère, voix, motivations)</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
                rows={4}
                placeholder="Forgeron taciturne, paume calleuse, méfie-toi des étrangers. Parle peu, observe beaucoup. Cherche son apprenti disparu."
                className="field font-serif text-[13px] w-full resize-none"
              />
              <p className="font-mono text-[10px] text-ink-400 mt-1">
                Le MJ utilisera cette description pour parler en son nom.
              </p>
            </div>

            <PickerRow label="Race" options={RACES.map((r) => ({ id: r.id, label: r.label }))} selected={race ?? "human"} onSelect={(v) => setRace(v as RaceId)} />
            <PickerRow
              label="Classe / archétype (optionnel)"
              options={[{ id: "", label: "—" }, ...CLASSES.map((c) => ({ id: c.id, label: c.label }))]}
              selected={classId ?? ""}
              onSelect={(v) => setClassId(v ? (v as ClassId) : undefined)}
            />
            <PickerRow label="Genre" options={GENDERS} selected={appearance.gender} onSelect={(v) => set("gender", v as Appearance["gender"])} />
            <PickerRow label="Peau" options={SKIN_TONES} selected={appearance.skin} onSelect={(v) => set("skin", v)} />
            <PickerRow label="Cheveux" options={HAIR_COLORS} selected={appearance.hairColor} onSelect={(v) => set("hairColor", v)} />
            <PickerRow label="Coupe" options={HAIR_STYLES} selected={appearance.hairStyle} onSelect={(v) => set("hairStyle", v)} />
            <PickerRow label="Yeux" options={EYE_COLORS} selected={appearance.eyes} onSelect={(v) => set("eyes", v)} />
            {appearance.gender !== "female" && (
              <PickerRow label="Barbe" options={BEARDS} selected={appearance.beard} onSelect={(v) => set("beard", v)} />
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 flex flex-col items-center">
            <div className="w-full">
              <div className="eyebrow mb-2">Aperçu</div>
              <CharacterPortrait src={portraitUrl} alt={name || "PNJ"} size={320} fallbackInitials={name[0]?.toUpperCase()} />
              <button onClick={() => setSeed(newSeed())} className="btn-ghost w-full mt-3">
                ↻ Re-générer le portrait
              </button>
              <div className="mt-4 text-center">
                <div className="font-serif text-[20px] text-parchment leading-tight">{name || "—"}</div>
                <div className="font-mono text-[10px] tracking-label uppercase text-ink-300 mt-1">
                  {ROLE_OPTIONS.find((r) => r.id === role)?.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-rule">
          <button onClick={onClose} className="btn-ghost text-[12px]">Annuler</button>
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !description.trim()}
            className="btn-primary"
          >
            {busy ? "Création..." : "Faire entrer en scène"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function PickerRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={`px-2.5 py-1 rounded-sm border font-mono text-[10px] tracking-label uppercase transition-colors ${
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
