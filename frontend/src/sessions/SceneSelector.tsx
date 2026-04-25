import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS, SCENE_PRESETS, ScenePreset, buildMapUrlChain } from "../lib/scenePresets";
import type { CurrentScene } from "../lib/types";
import { newSeed } from "../lib/portrait";
import ProceduralBattlemap from "./ProceduralBattlemap";

interface Props {
  current?: CurrentScene;
  onPick: (scene: CurrentScene) => void | Promise<void>;
  onClose: () => void;
}

type Tab = "library" | "custom";

export default function SceneSelector({ current, onPick, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("library");
  const [activeCategory, setActiveCategory] = useState<ScenePreset["category"]>("exterior");
  const [previewSeed, setPreviewSeed] = useState<number>(() => current?.seed ?? newSeed());
  const [selectedPreset, setSelectedPreset] = useState<ScenePreset | undefined>(
    () => SCENE_PRESETS.find((p) => p.id === current?.id)
  );
  const [customLabel, setCustomLabel] = useState(current?.id?.startsWith("custom_") ? current.label : "");
  const [customPrompt, setCustomPrompt] = useState(current?.id?.startsWith("custom_") ? current.prompt : "");
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    return SCENE_PRESETS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const previewPrompt =
    tab === "library" ? selectedPreset?.prompt : customPrompt.trim();
  const previewLabel =
    tab === "library" ? selectedPreset?.label ?? "Aucune scène" : customLabel.trim() || "Scène libre";
  const previewUrls = useMemo(
    () => (previewPrompt ? buildMapUrlChain(previewPrompt, previewSeed) : []),
    [previewPrompt, previewSeed]
  );
  const [aiIdx, setAiIdx] = useState(0);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  useEffect(() => {
    setAiIdx(0);
    setAiLoaded(false);
    setAiFailed(false);
  }, [previewUrls.join("|")]);
  useEffect(() => {
    if (aiLoaded || aiFailed) return;
    const t = setTimeout(() => {
      setAiIdx((i) => {
        if (i + 1 < previewUrls.length) return i + 1;
        setAiFailed(true);
        return i;
      });
    }, 12000);
    return () => clearTimeout(t);
  }, [aiIdx, aiLoaded, aiFailed, previewUrls.length]);
  const aiUrl = previewUrls[aiIdx] ?? null;

  async function applyLibrary() {
    if (!selectedPreset) return;
    setBusy(true);
    await onPick({
      id: selectedPreset.id,
      label: selectedPreset.label,
      prompt: selectedPreset.prompt,
      seed: previewSeed,
      category: selectedPreset.category,
    });
    setBusy(false);
  }

  async function applyCustom() {
    if (!customPrompt.trim()) return;
    setBusy(true);
    await onPick({
      id: `custom_${Date.now()}`,
      label: customLabel.trim() || "Scène libre",
      prompt: customPrompt.trim(),
      seed: previewSeed,
    });
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 backdrop-blur-sm fade-in" onClick={onClose}>
      <div
        className="panel-gold w-[min(96vw,1100px)] max-h-[92vh] flex flex-col shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div>
            <div className="eyebrow mb-1">Décors</div>
            <h2 className="font-serif text-[22px] text-parchment m-0">Choisir la scène</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("library")}
              className={`font-mono text-[11px] tracking-label uppercase px-3 py-1.5 rounded-sm border transition-colors ${
                tab === "library" ? "border-gold-500 text-gold-300 bg-ink-800/60" : "border-hairline text-ink-300 hover:border-gold-500/50"
              }`}
            >
              Bibliothèque
            </button>
            <button
              onClick={() => setTab("custom")}
              className={`font-mono text-[11px] tracking-label uppercase px-3 py-1.5 rounded-sm border transition-colors ${
                tab === "custom" ? "border-gold-500 text-gold-300 bg-ink-800/60" : "border-hairline text-ink-300 hover:border-gold-500/50"
              }`}
            >
              Sur mesure
            </button>
            <button onClick={onClose} className="font-mono text-[11px] text-ink-300 hover:text-parchment ml-3">
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: picker */}
          <div className="w-[420px] border-r border-rule overflow-y-auto scrollbar-thin px-5 py-4">
            {tab === "library" ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(Object.keys(CATEGORY_LABELS) as ScenePreset["category"][]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-sm border font-mono text-[10px] tracking-label uppercase transition-colors ${
                        activeCategory === cat
                          ? "border-gold-500 bg-ink-800/70 text-gold-300"
                          : "border-hairline text-ink-300 hover:border-gold-500/50 hover:text-parchment"
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
                <ul className="space-y-1.5">
                  {grouped.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => {
                          setSelectedPreset(p);
                          setPreviewSeed(newSeed());
                        }}
                        className={`w-full text-left panel p-3 transition-colors ${
                          selectedPreset?.id === p.id ? "border-gold-500 bg-ink-800/60" : "hover:border-hairline"
                        }`}
                      >
                        <div className="font-serif text-[15px] text-parchment">{p.label}</div>
                        {p.hint && (
                          <div className="font-serif italic text-[12px] text-ink-300 mt-0.5 leading-snug">{p.hint}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="label mb-2">Nom de la scène</div>
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    maxLength={50}
                    placeholder="L'antre du dragon"
                    className="field font-serif text-[15px] w-full"
                  />
                </div>
                <div>
                  <div className="label mb-2">Description (en anglais conseillé pour l'IA)</div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={6}
                    placeholder="vast underground cavern with a massive sleeping red dragon, gold piles, broken pillars..."
                    className="field font-mono text-[12px] w-full resize-none"
                  />
                  <p className="font-serif italic text-[11px] text-ink-400 mt-1">
                    Le style top-down + couleurs chaudes est ajouté automatiquement.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="eyebrow mb-0.5">Aperçu</div>
                <div className="font-serif text-[18px] text-parchment leading-tight">{previewLabel}</div>
              </div>
              {previewPrompt && (
                <button onClick={() => setPreviewSeed(newSeed())} className="btn-ghost text-[11px]">
                  ↻ Re-générer
                </button>
              )}
            </div>

            {previewPrompt ? (
              <div className="rounded-md overflow-hidden border border-hairline-strong bg-ink-900 aspect-square shadow-panel relative">
                <ProceduralBattlemap label={previewLabel} prompt={previewPrompt} seed={previewSeed} />
                {aiUrl && !aiFailed && (
                  <img
                    key={aiUrl}
                    src={aiUrl}
                    alt={previewLabel}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: aiLoaded ? 1 : 0, transition: "opacity 600ms ease-out" }}
                    loading="eager"
                    onLoad={() => setAiLoaded(true)}
                    onError={() => {
                      setAiLoaded(false);
                      if (aiIdx + 1 < previewUrls.length) setAiIdx(aiIdx + 1);
                      else setAiFailed(true);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-hairline aspect-square flex items-center justify-center">
                <p className="font-serif italic text-ink-400 text-[14px]">
                  {tab === "library" ? "Choisis une scène à gauche." : "Décris ta scène à gauche."}
                </p>
              </div>
            )}

            <p className="font-mono text-[10px] tracking-label uppercase text-ink-400 text-center mt-3">
              Carte tactique procédurale instantanée · l'image IA s'ajoute par-dessus si elle charge
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-rule">
          <button onClick={onClose} className="btn-ghost text-[12px]">Annuler</button>
          <button
            onClick={tab === "library" ? applyLibrary : applyCustom}
            disabled={busy || (tab === "library" ? !selectedPreset : !customPrompt.trim())}
            className="btn-primary"
          >
            {busy ? "Application..." : "Définir comme scène actuelle"}
          </button>
        </footer>
      </div>
    </div>
  );
}
