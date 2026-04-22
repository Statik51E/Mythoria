interface Props { campaignName: string }

// Placeholder scene stage: a subtle top-down lantern-lit stone floor.
// In V2 this becomes a real map render. For now it's atmospheric CSS only.
export default function SceneStage({ campaignName: _ }: Props) {
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
      {/* subtle grain */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />
      {/* token cluster hint — placeholder for future map tokens */}
      <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-30">
        <Token color="gold" />
        <Token color="gold" />
        <Token color="gold" />
        <Token color="ember" />
      </div>
    </div>
  );
}

function Token({ color }: { color: "gold" | "ember" }) {
  const border = color === "gold" ? "rgba(217,185,104,.7)" : "rgba(200,90,58,.8)";
  const bg = color === "gold"
    ? "radial-gradient(circle at 35% 30%, #3a2a14, #120a04)"
    : "radial-gradient(circle at 35% 30%, #3a140a, #120404)";
  return (
    <div
      className="w-7 h-7 rounded-full"
      style={{ border: `2px solid ${border}`, background: bg, boxShadow: "0 0 12px rgba(0,0,0,.6)" }}
    />
  );
}
