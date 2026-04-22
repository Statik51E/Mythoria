import type { Character } from "../lib/types";

interface Props {
  campaignName: string;
  characters: Character[];
  currentUid: string;
}

export default function SceneStage({ campaignName: _, characters, currentUid }: Props) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(600px 400px at 50% 55%, rgba(109,138,90,.08), transparent 60%),
            radial-gradient(900px 600px at 20% 30%, rgba(201,162,74,.05), transparent 65%),
            linear-gradient(180deg, #0a0e12, #0b1014)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />
      {characters.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-30">
          <PlaceholderToken />
          <PlaceholderToken />
          <PlaceholderToken />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end gap-10 flex-wrap justify-center max-w-3xl">
            {characters.map((c) => (
              <CharacterToken key={c.id} character={c} mine={c.ownerUid === currentUid} />
            ))}
          </div>
        </div>
      )}
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
  const border = mine ? "rgba(217,185,104,.85)" : "rgba(109,138,90,.7)";
  const glow = mine ? "rgba(217,185,104,.35)" : "rgba(109,138,90,.25)";
  const bg = mine
    ? "radial-gradient(circle at 35% 30%, #4a3618, #1a0e04)"
    : "radial-gradient(circle at 35% 30%, #2a3a1f, #0c1408)";
  return (
    <div className="flex flex-col items-center gap-2 fade-in">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center font-serif text-[18px] text-parchment"
        style={{
          border: `2px solid ${border}`,
          background: bg,
          boxShadow: `0 0 24px ${glow}, inset 0 0 8px rgba(0,0,0,.6)`,
        }}
      >
        {initials || "?"}
      </div>
      <div className="font-mono text-[10px] tracking-label uppercase text-ink-300 text-center max-w-[80px] truncate">
        {character.name}
      </div>
    </div>
  );
}

function PlaceholderToken() {
  return (
    <div
      className="w-7 h-7 rounded-full"
      style={{
        border: "2px dashed rgba(150,140,120,.3)",
        background: "transparent",
      }}
    />
  );
}
