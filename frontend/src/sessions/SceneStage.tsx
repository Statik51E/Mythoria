import type { Character } from "../lib/types";

interface Props {
  campaignName: string;
  characters: Character[];
  currentUid: string;
  sceneTitle?: string;
}

export default function SceneStage({ campaignName, characters, currentUid, sceneTitle }: Props) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Parchment-like base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(1200px 700px at 50% 50%, rgba(78,62,38,.55), transparent 70%),
            radial-gradient(900px 600px at 20% 25%, rgba(201,162,74,.10), transparent 65%),
            radial-gradient(900px 600px at 80% 80%, rgba(122,107,200,.08), transparent 65%),
            linear-gradient(180deg, #1a1410, #0e0b08)
          `,
        }}
      />

      {/* Hex grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(60deg, rgba(217,185,104,.4) 1px, transparent 1px),
            linear-gradient(-60deg, rgba(217,185,104,.4) 1px, transparent 1px),
            linear-gradient(0deg, rgba(217,185,104,.4) 1px, transparent 1px)
          `,
          backgroundSize: "70px 121px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,.75) 100%)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.015) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Scene title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="font-mono text-[10px] tracking-eyebrow uppercase text-gold-500/60">Scène</div>
        <div className="font-serif italic text-[20px] text-parchment-2/80 mt-1 max-w-md">
          {sceneTitle ?? campaignName}
        </div>
      </div>

      {/* Tokens arranged in a circle around the center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: 360, height: 360 }}>
          {characters.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full opacity-40"
                style={{
                  border: "2px dashed rgba(217,185,104,.4)",
                  background: "rgba(217,185,104,.05)",
                }}
              />
              <div className="absolute font-mono text-[10px] tracking-label uppercase text-ink-400">
                Aucun héros
              </div>
            </div>
          ) : (
            characters.map((c, i) => {
              const angle = (i / characters.length) * Math.PI * 2 - Math.PI / 2;
              const radius = characters.length === 1 ? 0 : 130;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={c.id}
                  className="absolute top-1/2 left-1/2"
                  style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                >
                  <CharacterToken character={c} mine={c.ownerUid === currentUid} />
                </div>
              );
            })
          )}
          {/* Center sigil (lantern) */}
          {characters.length > 0 && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(217,185,104,.5), transparent 70%)",
                boxShadow: "0 0 60px 20px rgba(217,185,104,.18)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterToken({ character, mine }: { character: Character; mine: boolean }) {
  const initials = character.name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const border = mine ? "rgba(217,185,104,.95)" : "rgba(109,138,90,.85)";
  const glow = mine ? "rgba(217,185,104,.45)" : "rgba(109,138,90,.30)";
  const bg = mine
    ? "radial-gradient(circle at 35% 30%, #5a4220, #1a0e04)"
    : "radial-gradient(circle at 35% 30%, #2a3a1f, #0c1408)";
  return (
    <div className="flex flex-col items-center gap-2 fade-in">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-[22px] text-parchment shadow-panel"
        style={{
          border: `2px solid ${border}`,
          background: bg,
          boxShadow: `0 0 32px ${glow}, inset 0 0 10px rgba(0,0,0,.6)`,
        }}
      >
        {initials || "?"}
      </div>
      <div className="font-mono text-[10px] tracking-label uppercase text-parchment-2 text-center max-w-[100px] truncate">
        {character.name}
      </div>
      <div className="font-mono text-[9px] tracking-label uppercase text-ink-400 -mt-1">
        {character.className} · niv. {character.level}
      </div>
    </div>
  );
}
